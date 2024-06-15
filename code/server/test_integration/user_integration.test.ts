import { describe, test, expect, beforeAll, afterEach,beforeEach} from "@jest/globals";
import request from "supertest";
import { app } from "../../index";
import { cleanup } from "../../src/db/cleanup";

/**
 * Base route path for the API
 */
const routePath = "/ezelectronics";

/**
 * Sample users used in the tests
 */
const customer = {
  username: "customer1",
  name: "user1",
  surname: "user1",
  password: "user1",
  role: "Customer",
};
const admin = {
  username: "admin1",
  name: "user2",
  surname: "user2",
  password: "user2",
  role: "Admin",
};
const newUserData = {
  name: "newName",
  surname: "newSurname",
  address: "newAddress",
  birthdate: "2016-06-09",
};
const newadmin = {
  username: "newadmin",
  name: "admin",
  surname: "admin",
  password: "admin",
  role: "Admin",
};

/**
 * Cookies for the users. We use them to keep users logged in.
 * Creating them once and saving them in a variables outside of the tests will make cookies reusable
 */
let customerCookie: string;
let adminCookie: string;

/**
 * Helper function that creates a new user in the database.
 * Can be used to create a user before the tests or in the tests
 * It's also an implicit test since it checks if the return code is successful
 * @param userInfo Contains the user information of the user to be created
 */
const postUser = async (userInfo:any) => {
  try {
    const response = await request(app)
      .post(routePath + "/users")
      .send(userInfo)
      .expect(200);
    console.log(`User created successfully: ${userInfo.username}`);
  } catch (error) {
    console.error(`Error creating user ${userInfo.username}:`, error.response ? error.response.body : error);
    throw error;
  }
};

/**
 * Helper function used to login in a user and get the cookie
 * @param userInfo Contains the user information of the user to be logged in
 * @returns
 */
const login = async (userInfo: any) => {
  return new Promise<string>((resolve, reject) => {
    request(app)
      .post(routePath + "/sessions")
      .send(userInfo)
      .expect(200)
      .end((err, res) => {
        if (err) {
          console.error("Login error:", err);
          reject(err);
        } else {
          console.log("Login response:", res.body);
          const cookie = res.header["set-cookie"] ? res.header["set-cookie"][0] : null;
          if (cookie) {
            resolve(cookie);
          } else {
            reject(new Error("Cookie not set in response"));
          }
        }
      });
  });
};


  
/**
 * Before all the tests, we clean the database, create an Admin user and log in,
 * and save the cookie in the corresponding variable
 */
// TODO : is it ok to only test it whit admin user? I think yes
beforeAll(async () => {
  await cleanup();
  await postUser(admin);
  adminCookie = await login(admin);
  await postUser(customer);
  customerCookie = await login(customer);
});

// Before each test, clean the database to ensure a fresh state
beforeEach(async () => {
  await cleanup();
  await postUser(admin);
  adminCookie = await login(admin);
  await postUser(customer);
  customerCookie = await login(customer);
});

// After all tests, clean the database
afterEach(async () => {
  await cleanup();
  
});

describe("userRoutes integration tests", () => {
    describe("POST /users", () => {
      test("Creating a new user successfully", async () => {
        await request(app)
          .post(routePath + "/users")
          .send(customer)
          .expect(200);
        // Now we check the insertion is successful
        const users = await request(app)
          .get(routePath + "/users")
          .set("Cookie", adminCookie)
          .expect(200);
        // We expect two users, the admin created by the beforeAll and the customer created in this test
        expect(users.body).toHaveLength(2);
        let customerData = users.body.find(
          (user: any) => user.username === customer.username,
        );
        expect(customerData).toBeDefined();
        expect(customerData.name).toBe(customer.name);
        expect(customerData.surname).toBe(customer.surname);
        expect(customerData.role).toBe(customer.role);
      });
  });
   // Testing a database error
   test("Creating a user that already exists -> 409 UserAlreadyExistsError", async () => {
    await request(app)
      .post(routePath + "/users")
      .send(customer)
      .expect({ error: "The username already exists", status: 409 });
  });
  test("Creating a new user with missing parameters -> 422 validationError", async () => {
    await request(app)
      .post(routePath + "/users")
      .send({
        username: "",
        name: "test",
        surname: "test",
        password: "test",
        role: "Customer",
      })
      .expect(422);
    await request(app)
      .post(`${routePath}/users`)
      .send({
        username: "test",
        name: "",
        surname: "test",
        password: "test",
        role: "Customer",
      })
      .expect(422);
  });
  describe("GET /users", () => {
    test("Retrieving a list of all the users", async () => {
      const users = await request(app)
        .get(routePath + "/users")
        .set("Cookie", adminCookie)
        .expect(200);
      // we have two users in the db
      expect(users.body).toHaveLength(2);
      let customerData = users.body.find(
        (user: any) => user.username === customer.username,
      );
      expect(customerData).toBeDefined();
      expect(customerData.name).toBe(customer.name);
      expect(customerData.surname).toBe(customer.surname);
      expect(customerData.role).toBe(customer.role);
      let adminData = users.body.find(
        (user: any) => user.username === admin.username,
      );
      expect(adminData).toBeDefined();
      expect(adminData.name).toBe(admin.name);
      expect(adminData.surname).toBe(admin.surname);
      expect(adminData.role).toBe(admin.role);
    });
  });
  test("The user requesting the list is not an admin -> Unauthorized user error 401", async () => {
    customerCookie = await login(customer);
    await request(app)
      .get(routePath + "/users")
      .set("Cookie", customerCookie)
      .expect({ error: "User is not an admin", status: 401 });
    await request(app)
      .get(routePath + "/users")
      .expect({ error: "Unauthenticated user", status: 401 });
  });
});
describe("GET /users/roles/:role", () => {
  test("Requesting all the admin users", async () => {
    const admins = await request(app)
      .get(routePath + "/users/roles/Admin")
      .set("Cookie", adminCookie)
      .expect(200);
    // We have only one admin in the database
    expect(admins.body).toHaveLength(1);
    let adminData = admins.body[0];
    expect(adminData.username).toBe(admin.username);
    expect(adminData.name).toBe(admin.name);
    expect(adminData.surname).toBe(admin.surname);
  });

  test("Requesting all the users with invalid role -> validationError 422", async () => {
    await request(app)
      .get(routePath + "/users/roles/InvalidRole")
      .set("Cookie", adminCookie)
      .expect(422);
  });
  test("Requesting all the users with a role but in the db we have none", async () => {
    let result = await request(app)
      .get(routePath + "/users/roles/Manager")
      .set("Cookie", adminCookie)
      .expect(200);
    expect(result.body).toHaveLength(0);
  });
});
describe("GET /users/:username", () => {
  test("Retrieving own user data from your username", async () => {
    const admins = await request(app)
      .get(routePath + "/users/admin")
      .set("Cookie", adminCookie)
      .expect(200);
    let adm = admins.body;
    expect(adm.username).toBe(admin.username);
    expect(adm.name).toBe(admin.name);
    expect(adm.surname).toBe(admin.surname);
  });

  test("An admin accessing other user data", async () => {
    const req = await request(app)
      .get(routePath + "/users/customer")
      .set("Cookie", adminCookie)
      .expect(200);
    let customerDate = req.body;
    expect(customerDate.username).toBe(customer.username);
    expect(customerDate.name).toBe(customer.name);
    expect(customerDate.surname).toBe(customer.surname);
  });
  test("A normal user cannot access other users data", async () => {
    const response = await request(app)
    .get('/users/admin')
    .set('Cookie', customerCookie);
    console.log(response.body);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
    error: "This operation can be performed only by an admin",
    status: 401,
});

    test("If the provided username does not exist, we expect a 404", async () => {
      await request(app)
        .get(routePath + "/users/invalidUsername")
        .set("Cookie", adminCookie)
        .expect({ error: "The user does not exist", status: 404 });
    });
});
describe("DELETE /users/:username", () => {
  test("Customer trying to delete another user", async () => {
    customerCookie = await login(customer);
    await request(app)
      .delete(routePath + "/users/admin")
      .set("Cookie", customerCookie)
      .expect({
        error: "This operation can be performed only by an admin",
        status: 401,
      });
  });
  test("The username does not exist in the database", async () => {
    await request(app)
      .delete(routePath + "/users/invalidUsername")
      .set("Cookie", adminCookie)
      .expect({ error: "The user does not exist", status: 404 });
  });
  
});
describe("PATCH /users/:username", () => {
  // the user is not logged in
  test("The user is not logged in", async () => {
    await request(app)
      .patch(routePath + "/users/customer")
      .send(newUserData)
      .expect({ error: "Unauthenticated user", status: 401 });
  });
  // the name field is missing
  test("The name field is missing", async () => {
    await request(app)
      .patch(routePath + "/users/customer")
      .send({
        surname: "newSurname",
        address: "newAddress",
        birthdate: "2016-06-09",
      })
      .set("Cookie", adminCookie)
      .expect(422);
  });
  // the username is not an existing user
  test("The username is not an existing user", async () => {
    await request(app)
      .patch(routePath + "/users/invalidUsername")
      .send(newUserData)
      .set("Cookie", adminCookie)
      .expect({ error: "The user does not exist", status: 404 });
  });
  test("The user is not an admin and tries to modify another user", async () => {
    customerCookie = await login(customer);
    await request(app)
      .patch(routePath + "/users/admin")
      .send(newUserData)
      .set("Cookie", customerCookie)
      .expect({
        error: "This operation can be performed only by an admin",
        status: 401,
      });
  });
});
});
describe("DELETE /users", () => {
  test("A normal user trying to delete all users -> 401 error", async () => {
    customerCookie = await login(customer);
    await request(app)
      .delete(routePath + "/users")
      .set("Cookie", customerCookie)
      .expect({ error: "User is not an admin", status: 401 });
  });

describe("POST /sessions", () => {
  // the user is not in the database
  test("The user is not in the database", async () => {
    await request(app)
      .post(routePath + "/sessions")
      .send({ username: "invalidUsername", password: "invalidPassword" })
      .expect({ message: "Incorrect username and/or password" });
  });
  // successful login
  test("Successful login", async () => {
    await request(app)
      .post(routePath + "/sessions")
      .send({ username: "admin", password: "admin" })
      .expect(200);
  });
});

describe("DELETE /sessions/current", () => {
  // successful logout
  test("Successful logout", async () => {
    await request(app)
      .delete(routePath + "/sessions/current")
      .set("Cookie", adminCookie)
      .expect(200);
  });
});
});