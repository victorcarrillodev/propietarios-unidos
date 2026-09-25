import { describe, expect, it } from "vitest";
import { getPaginationMeta, getPaginationParams, paginate } from "./pagination";

describe("Pagination Utility", () => {
  describe("getPaginationParams", () => {
    it("returns default page 1 and default pageSize 25 when no query param is present", () => {
      const url = new URL("https://example.com/admin/members");
      const params = getPaginationParams(url);
      expect(params).toEqual({
        page: 1,
        pageSize: 25,
        offset: 0,
        limit: 25,
      });
    });

    it("respects custom pageSize and page param", () => {
      const url = new URL("https://example.com/admin/members?page=3");
      const params = getPaginationParams(url, 10);
      expect(params).toEqual({
        page: 3,
        pageSize: 10,
        offset: 20,
        limit: 10,
      });
    });

    it("handles invalid or negative page numbers safely", () => {
      const url1 = new URL("https://example.com/admin/members?page=-5");
      expect(getPaginationParams(url1).page).toBe(1);

      const url2 = new URL("https://example.com/admin/members?page=abc");
      expect(getPaginationParams(url2).page).toBe(1);
    });

    it("handles custom param name", () => {
      const url = new URL("https://example.com/admin/members?p=4");
      const params = getPaginationParams(url, 20, "p");
      expect(params).toEqual({
        page: 4,
        pageSize: 20,
        offset: 60,
        limit: 20,
      });
    });
  });

  describe("getPaginationMeta", () => {
    it("calculates pageCount correctly for zero records", () => {
      const params = { page: 1, pageSize: 25, offset: 0, limit: 25 };
      const meta = getPaginationMeta(params, 0);
      expect(meta.total).toBe(0);
      expect(meta.pageCount).toBe(1);
    });

    it("calculates pageCount correctly when total is an exact multiple", () => {
      const params = { page: 2, pageSize: 25, offset: 25, limit: 25 };
      const meta = getPaginationMeta(params, 50);
      expect(meta.total).toBe(50);
      expect(meta.pageCount).toBe(2);
    });

    it("calculates pageCount correctly when total has a remainder", () => {
      const params = { page: 1, pageSize: 25, offset: 0, limit: 25 };
      const meta = getPaginationMeta(params, 51);
      expect(meta.total).toBe(51);
      expect(meta.pageCount).toBe(3);
    });

    it("handles negative or NaN total safely", () => {
      const params = { page: 1, pageSize: 25, offset: 0, limit: 25 };
      const meta = getPaginationMeta(params, -10);
      expect(meta.total).toBe(0);
      expect(meta.pageCount).toBe(1);
    });
  });

  describe("paginate", () => {
    it("combines params and meta calculation in a single call", () => {
      const url = new URL("https://example.com/admin/members?page=2");
      const result = paginate(url, 45, 20);
      expect(result).toEqual({
        page: 2,
        pageSize: 20,
        offset: 20,
        limit: 20,
        total: 45,
        pageCount: 3,
      });
    });
  });
});
