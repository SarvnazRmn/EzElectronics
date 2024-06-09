import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"

import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { User, Role} from "../../src/components/user"
import { UserNotFoundError } from "../../src/errors/userError"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database } from "sqlite3"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe("T1 - createUser", () => {
    test("T1.1 : It should resolve true", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        });
        const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
        })
        const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
            return Buffer.from("hashedPassword")
        })
        const result = await userDAO.createUser("username", "name", "surname", "password", "role")
        expect(result).toBe(true)
        mockRandomBytes.mockRestore()
        mockDBRun.mockRestore()
        mockScrypt.mockRestore()

    })
    test("T1.2 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"))
            return {} as Database
        })

        await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow("Database error")

        mockDBRun.mockRestore()
    })
})

describe("T2 - getUserByUsername", () => {
    test("T2.1 : It should resolve with a user object", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, {
                username: "username",
                name: "name",
                surname: "surname",
                role: "Customer",
                address: "address",
                birthdate: "birthdate"
            })
            return {} as Database
        })
        
        const result = await userDAO.getUserByUsername("username")
        expect(result).toEqual(new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate"))
        
        mockDBGet.mockRestore()
    })

    test("T2.2 : It should reject with UserNotFoundError", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database
        })

        await expect(userDAO.getUserByUsername("nonexistingusername")).rejects.toThrow(UserNotFoundError)
        
        mockDBGet.mockRestore()
    })

    test("T2.3 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null)
            return {} as Database
        })

        await expect(userDAO.getUserByUsername("username")).rejects.toThrow("Database error")
        
        mockDBGet.mockRestore()
    })
})

describe("T3 - getAllUsers", () => {
    test("T3.1 : It should resolve with a list of user object", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { username: "user1", name: "Name1", surname: "Surname1", role: "Customer", address: "Address1", birthdate: "Birthdate1" },
                { username: "user2", name: "Name2", surname: "Surname2", role: "Admin", address: "Address2", birthdate: "Birthdate2" }
            ])
            return {} as Database
        })

        const result = await userDAO.getAllUsers()
        expect(result).toEqual([
            new User("user1", "Name1", "Surname1", Role.CUSTOMER, "Address1", "Birthdate1"),
            new User("user2", "Name2", "Surname2", Role.ADMIN, "Address2", "Birthdate2")
        ])

        mockDBAll.mockRestore()
    })

    test("T3.2 : It should resolve with an empty array", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database 
        })

        const result = await userDAO.getAllUsers()
        expect(result).toEqual([])

        mockDBAll.mockRestore()
    })

    test("T3.3 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), [])
            return {} as Database 
        })

        await expect(userDAO.getAllUsers()).rejects.toThrow("Database error")

        mockDBAll.mockRestore()
    })
})

describe("T4 - getUsersByRole", () => {    
    test("T4.1 : It should return a list of users", async () => {
        const userDAO = new UserDAO()
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [
                    { username: "user1", name: "Name1", surname: "Surname1", role: "Customer", address: "Address1", birthdate: "Birthdate1" },
                    { username: "user2", name: "Name2", surname: "Surname2", role: "Customer", address: "Address2", birthdate: "Birthdate2" }
                ])
                return {} as Database
            })

            const result = await userDAO.getUsersByRole("Customer")
            expect(result).toEqual([
                new User("user1", "Name1", "Surname1", Role.CUSTOMER, "Address1", "Birthdate1"),
                new User("user2", "Name2", "Surname2",  Role.CUSTOMER, "Address2", "Birthdate2")
            ])

            mockDBAll.mockRestore()
    })

    test("T4.2 : It should resolve with an empty array", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [])
            return {} as Database
        })

        const result = await userDAO.getUsersByRole("nonexistingrole")
        expect(result).toEqual([])

        mockDBAll.mockRestore()
    })

    test("T4.3 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), [])
            return {} as Database
        })

        await expect(userDAO.getUsersByRole("role")).rejects.toThrow("Database error")

        mockDBAll.mockRestore()
    })
})

describe("T5 - deleteUser", () => {
    test("T5.1 : It should resolve with true", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        const result = await userDAO.deleteUser("username")
        expect(result).toBe(true)

        mockDBRun.mockRestore()
    })

    test("T5.2 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"))
            return {} as Database
        })

        await expect(userDAO.deleteUser("username")).rejects.toThrow("Database error")

        mockDBRun.mockRestore()
    })
})

describe("T6 : deleteAllNonAdminUsers", () => {
    test("T6.1 : It should resolve with true", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database
        })

        const result = await userDAO.deleteAllNonAdminUsers()
        expect(result).toBe(true)

        mockDBRun.mockRestore()
    })

    test("T6.2 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"))
            return {} as Database
        })

        await expect(userDAO.deleteAllNonAdminUsers()).rejects.toThrow("Database error")

        mockDBRun.mockRestore()
    })
})

describe("T7 - updateUserInfo", () => {
    test("T7.1 : It should resolve with the updated user object", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null)
            return {} as Database 
        })
        const mockGetUserByUsername = jest.spyOn(userDAO, "getUserByUsername").mockResolvedValue(
            new User("username", "newName", "newSurname", Role.CUSTOMER, "newAddress", "newBirthdate")
        )

        const result = await userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate")
        expect(result).toEqual(new User("username", "newName", "newSurname", Role.CUSTOMER, "newAddress", "newBirthdate"))

        mockDBRun.mockRestore()
        mockGetUserByUsername.mockRestore()
    })

    test("T7.2 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"))
            return {} as Database
        })

        await expect(userDAO.updateUserInfo("username", "newName", "newSurname", "newAddress", "newBirthdate")).rejects.toThrow("Database error")

        mockDBRun.mockRestore()
    })
})

describe("T8 - getIsUserAuthenticated", () => {
    test("T8.1 : It should resolve with true if the user is successfully authenticated", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", password: "hashedPasswird", salt: "salt" })
            return {} as Database
        })
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockReturnValue(Buffer.from("hashedPasswird", "hex"))
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockReturnValue(true)

        const result = await userDAO.getIsUserAuthenticated("username", "plainPassword")
        expect(result).toBe(true)

        mockDBGet.mockRestore()
        mockScryptSync.mockRestore()
        mockTimingSafeEqual.mockRestore()
    })

    test("T8.2 : It should resolve with false if the user is not found", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, null)
            return {} as Database 
        })

        const result = await userDAO.getIsUserAuthenticated("username", "password")
        expect(result).toBe(false)

        mockDBGet.mockRestore()
    })

    test("T8.3 : It should resolve with false if the password does not match", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(null, { username: "username", password: "hashedPassword", salt: "salt" })
            return {} as Database 
        })
        const mockScryptSync = jest.spyOn(crypto, "scryptSync").mockReturnValue(Buffer.from("differentHashedPassword", "hex"))
        const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockReturnValue(false)

        const result = await userDAO.getIsUserAuthenticated("username", "plainPassword")
        expect(result).toBe(false)

        mockDBGet.mockRestore()
        mockScryptSync.mockRestore()
        mockTimingSafeEqual.mockRestore()
    })

    test("T8.4 : It should reject with an error if the database query fails", async () => {
        const userDAO = new UserDAO()
        const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null)
            return {} as Database
        })

        await expect(userDAO.getIsUserAuthenticated("username", "password")).rejects.toThrow("Database error")

        mockDBGet.mockRestore()
    })
})

