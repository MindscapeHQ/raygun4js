describe("Raygun suite", function() {
  it("Raygun save offline default to false", function() {
    expect(Raygun.saveIfOffline()).toBe(false);
  });

  it("Raygun set save offline", function() {
    expect(Raygun.saveIfOffline(true)).toBe(true);
  });
});
