/*jshint esversion: 6 */

var cwvfactory = require('./core-web-vitals');

describe("core-web-vitals", () => {
    let CoreWebVitals = window.raygunCoreWebVitalFactory({ webVitals: null }), queue = [];
    CoreWebVitals.attach(e => queue.push(e));

    describe("handler is called", () => {
        CoreWebVitals.handler({ name: "FID", value: "1" });
        
        it("creates the appropriate payload", () => {
            expect(queue.pop()).toEqual({
                url: "FID",
                timing: {
                    t: "w",
                    du: "1"
                }
            });
        });
    })
});