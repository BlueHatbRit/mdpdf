import { exists as _exists, unlinkSync, existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import should from 'should';
import { execa } from 'execa';
import { convert } from '../src/index.js';
import { createOptions } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function clean() {
  const filesToRemove = ['./README.pdf', './README.html', './output.pdf', './test-img-output.pdf'];

  filesToRemove.forEach(file => {
    _exists(file, exists => {
      if (exists) {
        unlinkSync(file);
      }
    });
  });
}

describe('Convert CLI', function() {
  this.timeout(50000);

  after(clean);
  beforeEach(clean);

  context('when given a markdown file', () => {
    it('creates a pdf', done => {
      execa('./bin/index.js', ['./README.md'])
        .then(result => {
          const stdout = result.stdout;
          const pdfExists = existsSync('./README.pdf');

          pdfExists.should.be.true();
          stdout.should.endWith('README.pdf');

          done();
        })
        .catch(done);
    });
  });

  context('when passed debug flag', () => {
    it('creates a pdf and html file', done => {
      execa('./bin/index.js', ['./README.md', '--debug'])
        .then(result => {
          const stdout = result.stdout;
          const pdfExists = existsSync('./README.pdf');
          const htmlExists = existsSync('./README.html');

          pdfExists.should.be.true();
          htmlExists.should.be.true();
          stdout.should.endWith('README.pdf');

          done();
        })
        .catch(done);
    });
  });

  context('when passed a destination', () => {
    it('creates a pdf at the specified destination', done => {
      execa('./bin/index.js', ['./README.md', 'output.pdf'])
        .then(result => {
          const stdout = result.stdout;
          const pdfExists = existsSync('./output.pdf');

          pdfExists.should.be.true();
          stdout.should.endWith('output.pdf');

          done();
        })
        .catch(done);
    });
  });

  context('when given markdown with an image', () => {
    it('creates a pdf', done => {
      execa('./bin/index.js', ['./tests/test.md', './test-img-output.pdf'])
        .then(result => {
          const stdout = result.stdout;
          const pdfExists = existsSync('./test-img-output.pdf');

          pdfExists.should.be.true();
          stdout.should.endWith('test-img-output.pdf');

          done();
        })
        .catch(done);
    });
  });
});

describe('Convert API', function() {
  this.timeout(10000);

  after(clean);
  beforeEach(clean);

  context('when given a markdown source', () => {
    it('creates a pdf', done => {
      const options = createOptions({
        source: 'README.md',
      });
      convert(options)
        .then(pdfPath => {
          const pdfExists = existsSync('./README.pdf');

          pdfExists.should.be.true();

          done();
        })
        .catch(done);
    });
  });

  context('when debug is true', () => {
    it('creates a html file', done => {
      const options = createOptions({
        source: 'README.md',
        debug: true,
      });
      convert(options)
        .then(pdfPath => {
          const pdfExists = existsSync('./README.pdf');
          const htmlExists = existsSync('./README.html');

          pdfExists.should.be.true();
          htmlExists.should.be.true();

          done();
        })
        .catch(done);
    });
  });

  context('when destination is set', () => {
    it('creates a pdf at the destination', done => {
      const options = createOptions({
        source: 'README.md',
        destination: 'output.pdf',
      });
      convert(options)
        .then(pdfPath => {
          const pdfExists = existsSync('./output.pdf');

          pdfExists.should.be.true();

          done();
        })
        .catch(done);
    });
  });
});
