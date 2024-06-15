import { describe, test, expect, afterEach, jest } from "@jest/globals";
import db from "../../src/db/db";
import ReviewDAO from "../../src/dao/reviewDAO";
import { User } from "../../src/components/user";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ProductNotFoundError } from "../../src/errors/productError";
import dayjs from 'dayjs';
import { Database } from 'sqlite3';
import { ProductReview } from "../../src/components/review";

jest.mock("../../src/db/db");

afterEach(() => {
  jest.clearAllMocks();
});

describe("ReviewDAO", () => {
  describe("addReview", () => {
    test("Correctly adds a new review", async () => {
      const mockGet = jest.spyOn(db, "get").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
          callback(null, { count: 0 });
          return {} as Database;
        }
      );

      const mockRun = jest.spyOn(db, "run").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null) => void): Database => {
          callback(null);
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = dao.addReview("iphone", { username: "sarvnaz" } as User, 5, "great product");

      await expect(result).resolves.toBeUndefined();

      expect(mockGet).toBeCalledWith(
        "SELECT COUNT(*) as count FROM reviews WHERE model = ? AND user = ?",
        ["iphone", "sarvnaz"],
        expect.any(Function)
      );

      expect(mockRun).toBeCalledWith(
        "INSERT INTO reviews (model, user, score, comment, date) VALUES (?, ?, ?, ?, ?)",
        ["iphone", "sarvnaz", 5, "great product", dayjs().format('YYYY-MM-DD')],
        expect.any(Function)
      );

      mockGet.mockRestore();
      mockRun.mockRestore();
    });

    test("Rejects if review already exists", async () => {
      const mockGet = jest.spyOn(db, "get").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
          callback(null, { count: 1 });
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = dao.addReview("iphone", { username: "sarvnaz" } as User, 5, "great product");

      await expect(result).rejects.toThrow(ExistingReviewError);

      expect(mockGet).toBeCalledWith(
        "SELECT COUNT(*) as count FROM reviews WHERE model = ? AND user = ?",
        ["iphone", "sarvnaz"],
        expect.any(Function)
      );

      mockGet.mockRestore();
    });

    test("Rejects on database error during check", async () => {
      const mockGet = jest.spyOn(db, "get").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
          callback(new Error("Database error"), null);
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = dao.addReview("iphone", { username: "sarvnaz" } as User, 5, "great product");

      await expect(result).rejects.toThrow("Database error");

      expect(mockGet).toBeCalledWith(
        "SELECT COUNT(*) as count FROM reviews WHERE model = ? AND user = ?",
        ["iphone", "sarvnaz"],
        expect.any(Function)
      );

      mockGet.mockRestore();
    });

    test("Rejects on database error during insertion", async () => {
      const mockGet = jest.spyOn(db, "get").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
          callback(null, { count: 0 });
          return {} as Database;
        }
      );

      const mockRun = jest.spyOn(db, "run").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null) => void): Database => {
          callback(new Error("Database error"));
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = dao.addReview("iphone", { username: "sarvnaz" } as User, 5, "great product");

      await expect(result).rejects.toThrow("Database error");

      expect(mockGet).toBeCalledWith(
        "SELECT COUNT(*) as count FROM reviews WHERE model = ? AND user = ?",
        ["iphone", "sarvnaz"],
        expect.any(Function)
      );

      expect(mockRun).toBeCalledWith(
        "INSERT INTO reviews (model, user, score, comment, date) VALUES (?, ?, ?, ?, ?)",
        ["iphone", "sarvnaz", 5, "great product", dayjs().format('YYYY-MM-DD')],
        expect.any(Function)
      );

      mockGet.mockRestore();
      mockRun.mockRestore();
    });
  });

  describe("getProductReviews", () => {
    test("Returns reviews for a product", async () => {
      const mockAll = jest.spyOn(db, "all").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, rows: any[]) => void): Database => {
          callback(null, [
            { model: "iphone", user: "user1", score: 5, comment: "Great product", date: "2023-01-01" },
            { model: "iphone", user: "user2", score: 4, comment: "Good product", date: "2023-01-02" }
          ]);
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = dao.getProductReviews("iphone");

      await expect(result).resolves.toEqual([
        new ProductReview("iphone", "user1", 5, "2023-01-01", "Great product"),
        new ProductReview("iphone", "user2", 4,"2023-01-02", "Good product")
      ]);

      expect(mockAll).toBeCalledWith(
        "SELECT * FROM reviews WHERE model = ?",
        ["iphone"],
        expect.any(Function)
      );

      mockAll.mockRestore();
    });

    test("return empty list if no reviews found", async () => {
      const mockAll = jest.spyOn(db, "all").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, rows: any[]) => void): Database => {
          callback(null, []);
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = await dao.getProductReviews("nonexistent");

      expect(result).toEqual([]);
      expect(mockAll).toBeCalledWith(
        "SELECT * FROM reviews WHERE model = ?",
        ["nonexistent"],
        expect.any(Function)
      );

      mockAll.mockRestore();
    });

    test("Rejects on database error", async () => {
      const mockAll = jest.spyOn(db, "all").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, rows: any) => void): Database => {
          callback(new Error("Database error"), null);
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = dao.getProductReviews("iphone");

      await expect(result).rejects.toThrow("Database error");

      expect(mockAll).toBeCalledWith(
        "SELECT * FROM reviews WHERE model = ?",
        ["iphone"],
        expect.any(Function)
      );

      mockAll.mockRestore();
    });
  });
});
describe("deleteReview", () => {
  test("Correctly deletes a review", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementation(
      (sql, param, callback) => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementation(
      (sql, param, callback) => {
        callback(null, { model: "iphone", user: "sarvnaz" });
        return {} as Database;
      }
    );

    const mockRun = jest.spyOn(db, "run").mockImplementation(
      (sql, param, callback) => {
        callback(null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = await dao.deleteReview("iphone", { username: "sarvnaz" } as User);

    expect(result).toBe(undefined);

    expect(mockGetProduct).toHaveBeenCalled()
    expect(mockGetReview).toHaveBeenCalled()
    expect(mockRun).toHaveBeenCalled()

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
    mockRun.mockRestore();
  });

  test("Rejects if product does not exist", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(null, null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    await expect(dao.deleteReview("nonexistent", { username: "laura" } as User)).rejects.toThrow(ProductNotFoundError);
    expect(mockGetProduct).toHaveBeenCalled()

    mockGetProduct.mockRestore();
  });

  test("Rejects if review does not exist", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(null, null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    await expect(dao.deleteReview("iphone", { username: "laura" } as User)).rejects.toThrow(NoReviewProductError);

    expect(mockGetProduct).toHaveBeenCalled()
    expect(mockGetReview).toHaveBeenCalled()

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
  });

  test("Rejects on database error during product check", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(Error("Database error"), null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    await expect(dao.deleteReview("iphone", { username: "laura" } as User)).rejects.toThrow("Database error");
    expect(mockGetProduct).toHaveBeenCalled()

    mockGetProduct.mockRestore();
  });

  test("Rejects on database error during review check", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(new Error("Database error"), null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    await expect(dao.deleteReview("iphone", { username: "laura" } as User)).rejects.toThrow("Database error");
    expect(mockGetProduct).toHaveBeenCalled()
    expect(mockGetReview).toHaveBeenCalled()

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
  });

  test("Rejects on database error during deletion", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementationOnce(
      (sql, param, callback) => {
        callback(null, { model: "iphone", user: "sarvnaz" });
        return {} as Database;
      }
    );

    const mockRun = jest.spyOn(db, "run").mockImplementation(
      (sql, param, callback) => {
        callback(new Error("Database error"));
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    await expect(dao.deleteReview("iphone", { username: "laura" } as User)).rejects.toThrow("Database error");
    expect(mockGetProduct).toHaveBeenCalled()
    expect(mockGetReview).toHaveBeenCalled()
    expect(mockRun).toHaveBeenCalled()

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
    mockRun.mockRestore();
  });
});

describe("deleteReviewsOfProduct", () => {
  test("Correctly deletes reviews of a product", async () => {
    const mockRun = jest.spyOn(db, "run").mockImplementation(
      (sql, param, callback) => {
        callback(null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteReviewsOfProduct("iphone");

    await expect(result).resolves.toBeUndefined();
    expect(mockRun).toHaveBeenCalled()

    mockRun.mockRestore();
  });

  test("Rejects on database error during product check", async () => {
    const mockRun = jest.spyOn(db, "run").mockImplementationOnce(
      (sql, param, callback) => {
        callback(new Error("Database error"), null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    await expect(dao.deleteReviewsOfProduct("iphone")).rejects.toThrow("Database error");
    expect(mockRun).toHaveBeenCalled();

    mockRun.mockRestore();
  });

  test("Rejects on database error during deletion", async () => {
    const mockRun = jest.spyOn(db, "run").mockImplementation(
      (sql, param, callback) => {
        callback(new Error("Database error"));
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    await expect(dao.deleteReviewsOfProduct("iphone")).rejects.toThrow("Database error");
    expect(mockRun).toHaveBeenCalled();

    mockRun.mockRestore();
  });
});

describe("deleteAllReviews", () => {
  test("Deletes all reviews", async () => {
    const mockRun = jest.spyOn(db, "run").mockImplementation(
      (sql: string, callback: (err: Error | null) => void): any => {
        callback(null);
        return {} as any;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteAllReviews();

    await expect(result).resolves.toBeUndefined();

    expect(mockRun).toBeCalledWith(
      "DELETE FROM reviews",
      expect.any(Function)
    );

    mockRun.mockRestore();
  });

  test("Rejects on database error", async () => {
    const mockRun = jest.spyOn(db, "run").mockImplementation(
      (sql: string, callback: (err: Error | null) => void): any => {
        callback(new Error("Database error"));
        return {} as any;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteAllReviews();

    await expect(result).rejects.toThrow("Database error");

    expect(mockRun).toBeCalledWith(
      "DELETE FROM reviews",
      expect.any(Function)
    );

    mockRun.mockRestore();
  });
});
