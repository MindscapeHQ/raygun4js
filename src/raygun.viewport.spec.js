/**
 * @prettier
 */

require('./raygun.viewport');

const fakeWidth = 1920;
const fakeHeight = 1080;

const FakeWindow = {
  innerWidth: fakeWidth,
  innerHeight: fakeHeight
};

const FakeDocument = {
  documentElement: {
    clientWidth: fakeWidth,
    clientHeight: fakeHeight
  }
};

const FakeRaygun = {
  Utilities: window.raygunUtilityFactory(FakeWindow, {})
};

function getViewportClass(windowObject, documentObject) {
  return window.raygunViewportFactory(windowObject, documentObject, FakeRaygun);
}

describe('Viewport', () => {
  describe('getViewportDimensions', () => {
    describe('with undefined window object', () => {
      it('returns null result', () => {
        const viewport = getViewportClass(undefined, FakeDocument);
        const result = viewport.getViewportDimensions();

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
      });
    });

    describe('with undefined document object', () => {
      it('returns null result', () => {
        const viewport = getViewportClass(FakeWindow, undefined);
        const result = viewport.getViewportDimensions();

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
      });
    });

    describe('with zero width and height values', () => {
      it('returns null result', () => {
        const viewport = getViewportClass({
          innerWidth: 0,
          innerHeight: 0
        }, {
          documentElement: {
            clientWidth: 0,
            clientHeight: 0
          }
        });

        const result = viewport.getViewportDimensions();

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
      });
    });

    describe('with non-numeric width and height values', () => {
      it('returns null result', () => {
        const viewport = getViewportClass({
          innerWidth: 'a',
          innerHeight: 'b'
        }, {
          documentElement: {
            clientWidth: 'a',
            clientHeight: 'b'
          }
        });

        const result = viewport.getViewportDimensions();

        expect(result.width).toBeNull();
        expect(result.height).toBeNull();
      });
    });

    describe('with a window object that does not support innerWidth and innerHeight', () => {
      it('will fallback to document dimensions', () => {
        const viewport = getViewportClass({}, {
          documentElement: {
            clientWidth: 4096,
            clientHeight: 2160
          }
        });
        const result = viewport.getViewportDimensions();

        expect(result.width).toEqual(4096);
        expect(result.height).toEqual(2160);
      });
    });

    describe('with window and document object that contain valid width and height', () => {
      describe('with equal width and height values', () => {
        it('will return the inner width and height from the window', () => {
          const viewport = getViewportClass(FakeWindow, FakeDocument);
          const result = viewport.getViewportDimensions();

          expect(result.width).toEqual(fakeWidth);
          expect(result.height).toEqual(fakeHeight);
        });
      });

      describe('with window values that include the scrollbar width and height', () => {
        it('will take the largest dimensions to include the scrollbar', () => {
          const viewport = getViewportClass({
            innerWidth: 1920,
            innerHeight: 1080
          }, {
            documentElement: {
              clientWidth: 1904,
              clientHeight: 1064
            }
          });
          const result = viewport.getViewportDimensions();

          expect(result.width).toEqual(1920);
          expect(result.height).toEqual(1080);
        });
      });
    });
  });
});
