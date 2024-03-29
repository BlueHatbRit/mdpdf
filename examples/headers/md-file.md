# MDPDF - Markdown to PDF converter
[![Build Status](https://travis-ci.org/BlueHatbRit/mdpdf.svg?branch=master)](https://travis-ci.org/BlueHatbRit/mdpdf)

This is a command line markdown to pdf converter with support for page headers and footers. It's designed to be very configurable and take a custom stylesheet. Bundle the stylesheet and package with your project and let anyone generate the same PDF of your document.

## Installation

Install globally to use from the command line.

`npm install mdpdf -g`

Install locally to access the API.

`npm install mdpdf --save`

## Example usage

* `mdpdf README.md` - Simple convert using GitHub Markdown CSS and some additional basic stylings.
* `mdpdf README.md --style styles.css --header header.hbs --hHeight 22` - Convert with custom styling with a header of height 22mm.

## Options

* `--style` A single css stylesheet you wish to apply to the PDF
* `--header` A handlebars (.hbs) file to inject into the header of the PDF
* `--hHeight` The height of the header section in mm, this might take some fiddling to get just right
* `--debug` Mdpdf converts the markdown into html before making a pdf, this saves out the html as well as the pdf
* `--help` Display the help menu

## Emoji Support

In text emoji's are also supported, but there are a few instances of shorthand which do not work and require the longhand version, i.e. `:+1:` doesn't work but `:thumbsup:` will.

## Programatic API

The API is very straight forward with a single function `convert()` which takes some options. The convert method uses a promise. For a full example see the [bin/index.js](./bin/index.js)!

### Example API Usage

```JavaScript
const mdpdf = require('mdpdf');

let options = {
    source: path.join(__dirname, 'README.md'),
    destination: path.join(__dirname, 'output.pdf'),
    styles: path.join(__dirname, 'md-styles.css'),
    pdf: {
        format: 'A4'
    }
};

mdpdf.convert(options).then((pdfPath) => {
    console.log('PDF Path:', pdfPath);
}).catch((err) => {
    console.error(err);
});
```

### Options

* source - **required**, a full path to the source markdown file.
* destination - **required**, a full path to the destination (pdf) file.
* styles - A full path to a single css stylesheet which is applied last to the PDF.
* ghStyle - A boolean value of whether or not to use the GitHub Markdown CSS, set to `false` to turn this stylesheet off.
* defaultStyle - A boolean value of whether or not to use the additional default styles. These styles provide some things like a basic border and font size. Set to `false` to turn stylesheet off.
* header - A full path to a the Handlebars (`.hbs`) file which will be your header. If you set this, you must set the header height (see below).
* debug - When this is set the intermediate HTML will be saved into a file, the value of this field should be the full path to the destination HTML.
* pdf - **required** An object which contains some sub parameters to control the final PDF document
    * format - **required** Final document format, allowed values are "A3, A4, A5, Legal, Letter, Tabloid"
    * header - A sub object which contains some header settings
        * height - Height of the documents header in mm (default 45mm). If you wish to use a header, then this must be set.
    * border - The document borders
