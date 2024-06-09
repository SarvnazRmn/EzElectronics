import { test, expect, jest } from "@jest/globals"
import UserController from "../../src/controllers/userController"
import UserDAO from "../../src/dao/userDAO"
import { User, Role } from "../../src/components/user"

jest.mock("../../src/dao/userDAO")

//Example of a unit test for the createUser method of the UserController
//The test checks if the method returns true when the DAO method returns true
//The test also expects the DAO method to be called once with the correct parameters

test("createUser - It should return true", async () => {
    const testUser = { //Define a test user object
        username: "test",
        name: "test",
        surname: "test",
        password: "test",
        role: "Manager"
    }
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true); //Mock the createUser method of the DAO
    const controller = new UserController(); //Create a new instance of the controller
    //Call the createUser method of the controller with the test user object
    const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

    //Check if the createUser method of the DAO has been called once with the correct parameters
    expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(testUser.username,
        testUser.name,
        testUser.surname,
        testUser.password,
        testUser.role);
    expect(response).toBe(true); //Check if the response is true
});

test("getUsers - It should return an array of users", async () => {
    const testUsers = [
        new User("username1", "name1", "surname1", Role.ADMIN, "address1", "birthdate1"),
        new User("username2", "name2", "surname2", Role.CUSTOMER, "address2", "birthdate2")
    ];
    jest.spyOn(UserDAO.prototype, "getAllUsers").mockResolvedValueOnce(testUsers); 

    const controller = new UserController(); 
    const response = await controller.getUsers(); 

    expect(UserDAO.prototype.getAllUsers).toHaveBeenCalledTimes(1);
    expect(response).toEqual(testUsers);
});

test("getUsersByRole - It should return an array of users with the specified role", async () => {
    const testRole = "Customer";
    const testUsers = [
        new User("username1", "name1", "surname1", Role.CUSTOMER, "address1", "birthdate1"),
        new User("username2", "name2", "surname2", Role.CUSTOMER, "address2", "birthdate2")
    ];
    jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(testUsers);

    const controller = new UserController();
    const response = await controller.getUsersByRole(testRole);

    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith(testRole);
    expect(response).toEqual(testUsers);
});

test("getUserByUsername - It should return a user with the specified username", async () => {
    const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(testUser);

    const controller = new UserController();
    const response = await controller.getUserByUsername(testUser, "username");

    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
    expect(response).toEqual(testUser);
});

test("deleteUser - It should return true if the user is successfully deleted", async () => {
    jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);

    const controller = new UserController();

    const response = await controller.deleteUser(new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate"), "username");

    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("username");
    expect(response).toBe(true);
});

test("deleteAll - It should return true if all non-Admin users are successfully deleted", async () => {
    jest.spyOn(UserDAO.prototype, "deleteAllNonAdminUsers").mockResolvedValueOnce(true);

    const controller = new UserController();
    const response = await controller.deleteAll();

    expect(UserDAO.prototype.deleteAllNonAdminUsers).toHaveBeenCalledTimes(1);
    expect(response).toBe(true);
});

test("updateUserInfo - It should return the updated user if the update is successful", async () => {
    const testUser = new User("username", "newName", "newSurname", Role.CUSTOMER, "newAddress", "newBirthdate");
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValueOnce(testUser);

    const controller = new UserController();
    const response = await controller.updateUserInfo(testUser, "newName", "newSurname", "newAddress", "newBirthdate", "username");

    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
    expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith("username", "newName", "newSurname", "newAddress", "newBirthdate");
    expect(response).toEqual(testUser);
});



