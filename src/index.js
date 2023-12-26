import { readFile as _readFile, writeFile as _writeFile, renameSync, unlinkSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import showdown from 'showdown';
const { setFlavor, Converter } = showdown;
import showdownEmoji from 'showdown-emoji';
import { launch } from 'puppeteer';
import handlebars from 'handlebars';
const { SafeString, compile } = handlebars;
import { allowUnsafeNewFunction } from 'loophole';
import { getStyles, getStyleBlock, qualifyImgSources } from './utils.js';
import { getOptions } from './puppeteer-helper.js';

const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main layout template
const layoutPath = join(__dirname, '/layouts/doc-body.hbs');
const headerLayoutPath = join(__dirname, '/layouts/header.hbs');
const footerLayoutPath = join(__dirname, '/layouts/footer.hbs');

// Syntax highlighting
const highlightJs =
  'file://' + join(__dirname, '/assets/highlight/highlight.pack.js');

function getAllStyles(options) {
  const cssStyleSheets = [];

  // GitHub Markdown Style
  if (options.ghStyle) {
    cssStyleSheets.push(
      join(__dirname, '/assets/github-markdown-css.css')
    );
  }
  // Highlight CSS
  cssStyleSheets.push(
    join(__dirname, '/assets/highlight/styles/github.css')
  );

  // Some additional defaults such as margins
  if (options.defaultStyle) {
    cssStyleSheets.push(join(__dirname, '/assets/default.css'));
  }

  // Optional user given CSS
  if (options.styles) {
    cssStyleSheets.push(options.styles);
  }

  return {
    styles: getStyles(cssStyleSheets),
    styleBlock: getStyleBlock(cssStyleSheets),
  };
}

function parseMarkdownToHtml(markdown, convertEmojis) {
  setFlavor('github');
  const options = {
    prefixHeaderId: false,
    ghCompatibleHeaderId: true,
  };

  // Sometimes emojis can mess with time representations
  // such as "00:00:00"
  if (convertEmojis) {
    options.extensions = [showdownEmoji];
  }

  const converter = new Converter(options);

  return converter.makeHtml(markdown);
}

export function convert(options) {
  options = options || {};
  if (!options.source) {
    throw new Error('Source path must be provided');
  }

  if (!options.destination) {
    throw new Error('Destination path must be provided');
  }

  options.assetDir = dirname(resolve(options.source));

  let template = {};
  const styles = getAllStyles(options);
  let css = new SafeString(styles.styleBlock);
  const local = {
    highlightJs,
    css: css,
  };

  // Pull in the header
  return prepareHeader(options, styles.styles)
    .then(header => {
      options.header = header;

      // Pull in the footer
      return prepareFooter(options);
    })
    .then(footer => {
      options.footer = footer;

      // Pull in the handlebars layout so we can build the document body
      return readFile(layoutPath, 'utf8');
    })
    .then(layout => {
      template = compile(layout);

      // Pull in the document source markdown
      return readFile(options.source, 'utf8');
    })
    .then(mdDoc => {
      // Compile the main document
      let content = parseMarkdownToHtml(mdDoc, !options.noEmoji);

      content = qualifyImgSources(content, options);

      local.body = new SafeString(content);
      // Use loophole for this body template to avoid issues with editor extensions
      const html = allowUnsafeNewFunction(() => template(local));

      return createPdf(html, options);
    });
}

function prepareHeader(options, css) {
  if (options.header) {
    let headerTemplate;

    // Get the hbs layout
    return readFile(headerLayoutPath, 'utf8')
      .then(headerLayout => {
        headerTemplate = compile(headerLayout);

        // Get the header html
        return readFile(options.header, 'utf8');
      })
      .then(headerContent => {
        const preparedHeader = qualifyImgSources(headerContent, options);

        // Compile the header template
        const headerHtml = headerTemplate({
          content: new SafeString(preparedHeader),
          css: new SafeString(css.replace(/"/gm, "'")),
        });

        return headerHtml;
      });
  } else {
    return Promise.resolve();
  }
}

function prepareFooter(options) {
  if (options.footer) {
    return readFile(options.footer, 'utf8').then(footerContent => {
      const preparedFooter = qualifyImgSources(footerContent, options);

      return preparedFooter;
    });
  } else {
    return Promise.resolve();
  }
}

function createPdf(html, options) {
  // Write html to a temp file
  let browser;
  let page;

  const tempHtmlPath = join(
    dirname(options.destination),
    '_temp.html'
  );

  return writeFile(tempHtmlPath, html)
    .then(() => {
      return launch({ headless: 'new' });
    })
    .then(newBrowser => {
      browser = newBrowser;
      return browser.newPage();
    })
    .then(p => {
      page = p;

      return page.goto('file:' + tempHtmlPath, { waitUntil: 'networkidle2' });
    })
    .then(() => {
      const puppetOptions = getOptions(options);

      return page.pdf(puppetOptions);
    })
    .then(() => {
      return browser.close();
    })
    .then(() => {
      if (options.debug) {
        renameSync(tempHtmlPath, options.debug);
      } else {
        unlinkSync(tempHtmlPath);
      }

      return options.destination;
    });
}
