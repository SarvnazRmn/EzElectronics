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
        new ProductReview("iphone", "user1", 5, "Great product", "2023-01-01"),
        new ProductReview("iphone", "user2", 4, "Good product", "2023-01-02")
      ]);

      expect(mockAll).toBeCalledWith(
        "SELECT * FROM reviews WHERE model = ?",
        ["iphone"],
        expect.any(Function)
      );

      mockAll.mockRestore();
    });

    test("Rejects if no reviews found", async () => {
      const mockAll = jest.spyOn(db, "all").mockImplementation(
        (sql: string, param: any[], callback: (err: Error | null, rows: any[]) => void): Database => {
          callback(null, []);
          return {} as Database;
        }
      );

      const dao = new ReviewDAO();
      const result = dao.getProductReviews("nonexistent");

      await expect(result).rejects.toThrow(NoReviewProductError);

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
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone", user: "sarvnaz" });
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
    const result = dao.deleteReview("iphone", { username: "sarvnaz" } as User);

    await expect(result).resolves.toBeUndefined();

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    expect(mockGetReview).toBeCalledWith(
      "SELECT * FROM reviews WHERE model = ? AND user = ?",
      ["iphone", "sarvnaz"],
      expect.any(Function)
    );

    expect(mockRun).toBeCalledWith(
      "DELETE FROM reviews WHERE model = ? AND user = ?",
      ["iphone", "sarvnaz"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
    mockRun.mockRestore();
  });

  test("Rejects if product does not exist", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteReview("nonexistent", { username: "sarvnaz" } as User);

    await expect(result).rejects.toThrow(ProductNotFoundError);

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["nonexistent"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
  });

  test("Rejects if review does not exist", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteReview("iphone", { username: "sarvnaz" } as User);

    await expect(result).rejects.toThrow(NoReviewProductError);

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    expect(mockGetReview).toBeCalledWith(
      "SELECT * FROM reviews WHERE model = ? AND user = ?",
      ["iphone", "sarvnaz"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
  });

  test("Rejects on database error during product check", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(new Error("Database error"), null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteReview("iphone", { username: "sarvnaz" } as User);

    await expect(result).rejects.toThrow("Database error");

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
  });

  test("Rejects on database error during review check", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(new Error("Database error"), null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteReview("iphone", { username: "sarvnaz" } as User);

    await expect(result).rejects.toThrow("Database error");

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    expect(mockGetReview).toBeCalledWith(
      "SELECT * FROM reviews WHERE model = ? AND user = ?",
      ["iphone", "sarvnaz"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
  });

  test("Rejects on database error during deletion", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone" });
        return {} as Database;
      }
    );

    const mockGetReview = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone", user: "sarvnaz" });
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
    const result = dao.deleteReview("iphone", { username: "sarvnaz" } as User);

    await expect(result).rejects.toThrow("Database error");

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    expect(mockGetReview).toBeCalledWith(
      "SELECT * FROM reviews WHERE model = ? AND user = ?",
      ["iphone", "sarvnaz"],
      expect.any(Function)
    );

    expect(mockRun).toBeCalledWith(
      "DELETE FROM reviews WHERE model = ? AND user = ?",
      ["iphone", "sarvnaz"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
    mockGetReview.mockRestore();
    mockRun.mockRestore();
  });
});
describe("deleteReviewsOfProduct", () => {
  test("Correctly deletes reviews of a product", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone" });
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
    const result = dao.deleteReviewsOfProduct("iphone");

    await expect(result).resolves.toBeUndefined();

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    expect(mockRun).toBeCalledWith(
      "DELETE FROM reviews WHERE model = ?",
      ["iphone"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
    mockRun.mockRestore();
  });

  test("Rejects if product does not exist", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteReviewsOfProduct("nonexistent");

    await expect(result).rejects.toThrow(ProductNotFoundError);

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["nonexistent"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
  });

  test("Rejects on database error during product check", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(new Error("Database error"), null);
        return {} as Database;
      }
    );

    const dao = new ReviewDAO();
    const result = dao.deleteReviewsOfProduct("iphone");

    await expect(result).rejects.toThrow("Database error");

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
  });

  test("Rejects on database error during deletion", async () => {
    const mockGetProduct = jest.spyOn(db, "get").mockImplementationOnce(
      (sql: string, param: any[], callback: (err: Error | null, row: any) => void): Database => {
        callback(null, { model: "iphone" });
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
    const result = dao.deleteReviewsOfProduct("iphone");

    await expect(result).rejects.toThrow("Database error");

    expect(mockGetProduct).toBeCalledWith(
      "SELECT * FROM products where model = ?",
      ["iphone"],
      expect.any(Function)
    );

    expect(mockRun).toBeCalledWith(
      "DELETE FROM reviews WHERE model = ?",
      ["iphone"],
      expect.any(Function)
    );

    mockGetProduct.mockRestore();
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
