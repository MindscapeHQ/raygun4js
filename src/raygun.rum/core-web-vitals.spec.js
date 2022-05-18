/*jshint esversion: 6 */

require('./core-web-vitals');

describe("core-web-vitals", () => {
    let CoreWebVitals = window.raygunCoreWebVitalFactory({ webVitals: null }), queue = [];
    CoreWebVitals.attach(e => queue.push(e));

    beforeEach(() => {
        queue = [];
    });

    describe("handler is called", () => {        
        it("creates the appropriate payload", () => {
            CoreWebVitals.handler({ name: "FID", value: "1" });

            expect(queue.pop()).toEqual({
                url: "FID",
                timing: {
                    t: "w",
                    du: "1"
                },
                parentResource: undefined
            });
        });
    });

    describe("event reports long metric value", () => {

        it('value is rounded to 3dp', () => {
            CoreWebVitals.handler({ name: "FID", value: 0.14589 });

            var res = queue.pop();
            expect(res.timing.du).toBe('0.146');
        });
    });
});
