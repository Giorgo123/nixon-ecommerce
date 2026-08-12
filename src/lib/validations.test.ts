import { describe, expect, it } from "vitest";
import { isValidEmail } from "./validations";

describe("isValidEmail", () => {
  it("accepts a normal email", () => {
    expect(isValidEmail("cliente@nixonstudio.com.ar")).toBe(true);
  });

  it("rejects an email without @", () => {
    expect(isValidEmail("clientenixonstudio.com.ar")).toBe(false);
  });

  it("rejects an email without a domain dot", () => {
    expect(isValidEmail("cliente@nixonstudio")).toBe(false);
  });

  it("rejects an email with spaces", () => {
    expect(isValidEmail("cliente @nixonstudio.com.ar")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });
});
