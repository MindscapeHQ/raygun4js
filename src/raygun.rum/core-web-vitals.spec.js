/*jshint esversion: 6 */

require('./core-web-vitals');

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
        
    });

    describe("event reports long metric value", () => {
        CoreWebVitals.handler({ name: "FID", value: "0.14589" });

        it('value is rounded to 3dp', () => {
            var res = queue.pop();
            expect(res.timing.du).toBe("0.146");
        });
    });
});