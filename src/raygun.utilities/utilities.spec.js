require('./index');

var object = {};
var utils = window.raygunUtilityFactory(window, object);

describe("raygun.utilities", () => {
    describe("uuid", () => {
        it("generates 36 characters", () => {
            expect(utils.getUuid().length).toBe(36);
        });
    });
});