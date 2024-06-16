import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let managerCookie: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(routePath+'/users')
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(routePath+'/sessions')
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    cleanup()
    await postUser(admin)
    await postUser(customer)
    await postUser(manager)
    adminCookie = await login(admin)
    customerCookie = await login(customer)
    managerCookie = await login(manager)
})

//After executing tests, we remove everything from our test database
afterAll(() => {
    cleanup()
})


const product1 = {model: 'product1', category: "Smartphone", quantity: 3, details: "details product1", sellingPrice: 100, arrivalDate: "2021-07-10"}
const product2 = {model: 'product2', category: "Laptop", quantity: 2, details: "details product2", sellingPrice: 100}
const product3 = {model: 'product3', category: "Appliance", quantity: 1, details: "details product3", sellingPrice: 100, arrivalDate: "2090-01-01"}


describe("Product routes integration tests", () => {


    describe("POST /products", () => {
        test("It should return a 401 error code Unauthorized", async () => {    
            // product with invalid date
            await request(app)
            .post(routePath+'/products')
            .send(product1)
            .set("Cookie", customerCookie)
            .expect(401)

        })
        test("It should return a 200 success code and create a new product", async () => {
            await request(app)
            .post(routePath+'/products')
            .send(product1)
            .set("Cookie", adminCookie)
            .expect(200)

            await request(app)
            .post(routePath+'/products')
            .send(product2)
            .set("Cookie", adminCookie)
            .expect(200)
        })

        test("It should return a 422 error code as the date is invalid", async () => {    
            // product with invalid date
            await request(app)
            .post(routePath+'/products')
            .send(product3)
            .set("Cookie", adminCookie)
            .expect(422)

        })
    })

    describe("PATCH /products/:model", () => {
        test("Changing the quantity of a product, expecting 200 success code", async () => {    
            
            let product  = await request(app)
            .patch(routePath+'/products/product1')
            .send({quantity: 2, changeDate: "2024-01-01"})
            .set("Cookie", adminCookie)
            .expect(200)

            let adm = product.body
            expect(adm.quantity).toBe(product1.quantity+2)


            product  = await request(app)
            .patch(routePath+'/products/product2')
            .send({quantity: 2})
            .set("Cookie", adminCookie)
            .expect(200)
            adm = product.body
            expect(adm.quantity).toBe(product2.quantity+2)


        })
        test("Changing the quantity of a product that doesn't exist, expecting 404 success code", async () => {    
            
            let product = await request(app)
            .patch(routePath+'/products/fakeModel')
            .send({quantity: 2, changeDate: "2024-01-01"})
            .set("Cookie", adminCookie)
            .expect(404)
        })

        test("Changing the quantity of a product with invalid date, expecting error codes", async () => {    
            
            await request(app)
            .patch(routePath+'/products/product1')
            .send({quantity: 2, changeDate: "2055-01-01"})
            .set("Cookie", adminCookie)
            .expect(422)

            await request(app)
            .patch(routePath+'/products/product2')
            .send({quantity: 0})
            .set("Cookie", adminCookie)
            .expect(422)

        })
    })

    describe("PATCH /products/:model/sell", () => {
        test("Selling a product, expecting 200 success code", async () => {    
            
            let resProduct1 = await request(app)
            .patch(routePath+'/products/product1/sell')
            .send({quantity: 2, sellingDate: "2024-02-01"})
            .set("Cookie", adminCookie)
            .expect(200)
            expect(resProduct1.body/*.quantity*/).toBe(true)

            let resProduct2 = await request(app)
            .patch(routePath+'/products/product2/sell')
            .send({quantity: 1})
            .set("Cookie", adminCookie)
            .expect(200)
            expect(resProduct2.body/*.quantity*/).toBe(true)
        })

        test("Selling a product that doesn't exist, expecting 404 success code", async () => {    
            
            let product = await request(app)
            .patch(routePath+'/products/fakeModel/sell')
            .send({quantity: 2, sellingDate: "2024-01-01"})
            .set("Cookie", adminCookie)
            .expect(404)
        })

        test("Selling a product with invalid date, expecting error codes", async () => {    
            
            await request(app)
            .patch(routePath+'/products/product1/sell')
            .send({quantity: 2, sellingDate: "2025-10-10"})
            .set("Cookie", adminCookie)
            .expect(422)

            await request(app)
            .patch(routePath+'/products/product2/sell')
            .send({quantity: 0})
            .set("Cookie", adminCookie)
            .expect(422)

        })
    }) 
    
    describe("GET /products", () => {
        test("Getting a product list by category", async () => {  
            let product = await request(app)
            .get(routePath+'/products')
            .send()
            .set("Cookie", adminCookie)
            .query({grouping: "category", category: "Smartphone"})
            .expect(200)
            let adm = product.body[0] 
            console.log(adm)
            expect(adm.sellingPrice).toBe(product1.sellingPrice)
            expect(adm.model).toBe(product1.model)
            expect(adm.category).toBe(product1.category)
            expect(adm.details).toBe(product1.details)
            expect(adm.arrivalDate).toBe("2024-01-01")
            expect(adm.quantity).toBe(product1.quantity)

        })



        test("Getting a product list by model name", async () => {  
            let product = await request(app)
            .get(routePath+'/products')
            .set("Cookie", adminCookie)
            .query({grouping: "model", model: "product1"})
            .expect(200)
            let adm = product.body[0]
            expect(adm.sellingPrice).toBe(product1.sellingPrice)
            expect(adm.model).toBe(product1.model)
            expect(adm.category).toBe(product1.category)
            expect(adm.details).toBe(product1.details)
            expect(adm.arrivalDate).toBe("2024-01-01")
            expect(adm.quantity).toBe(product1.quantity)

        })

        test("Getting a product list: bad request, expecting an error (grouping = model, category present)", async () => {  
            let product = await request(app)
            .get(routePath+'/products')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "model", category: "Smartphone"})
            .expect(422)
        })

        test("Getting a product list: bad request, expecting an error (grouping = category, category not valid)", async () => {  
            let product = await request(app)
            .get(routePath+'/products')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "category", category:"bad"})
            .expect(422)
        })

        test("Getting a product list: bad request, expecting an error (grouping = category, model present)", async () => {  
            let product = await request(app)
            .get(routePath+'/products')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "category", model:"product1"})
            .expect(422)
        })

        test("Getting a product list: bad request, expecting an error (grouping = model, model not present)", async () => {  
            let product = await request(app)
            .get(routePath+'/products')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "model", model:" "})
            .expect(422)
        })

        test("Getting a non-existing product: expecting error", async () => {  
            let product = await request(app)
            .get(routePath+'/products')
            .set("Cookie", adminCookie)
            .query({grouping: "model", model: "fakeModel"})
            .expect(404)

        })


    })


    describe("GET /products/available", () => {
        
        test("Getting available product list by model", async () => {  
            let product = await request(app)
            .get(routePath+'/products/available')
            .query({grouping: "model", model: "product1"})
            .set("Cookie", adminCookie)
            .expect(200)
            let adm = product.body[0]
            expect(adm.sellingPrice).toBe(product1.sellingPrice)
            expect(adm.model).toBe(product1.model)
            expect(adm.category).toBe(product1.category)
            expect(adm.details).toBe(product1.details)
            expect(adm.arrivalDate).toBe("2024-01-01")
            expect(adm.quantity).toBe(product1.quantity)

        })

        test("Getting available product list by category", async () => {  
            let product = await request(app)
            .get(routePath+'/products/available')
            .query({grouping: "category", category: "Smartphone"})
            .set("Cookie", adminCookie)
            .expect(200)
            let adm = product.body[0]
            expect(adm.sellingPrice).toBe(product1.sellingPrice)
            expect(adm.model).toBe(product1.model)
            expect(adm.category).toBe(product1.category)
            expect(adm.details).toBe(product1.details)
            expect(adm.arrivalDate).toBe("2024-01-01")
            expect(adm.quantity).toBe(product1.quantity)

        })

        test("Getting available product list: bad request, expecting an error (grouping = model, category present)", async () => {  
            let product = await request(app)
            .get(routePath+'/products/available')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "model", category: "Smartphone"})
            .expect(422)
        })

        test("Getting available product list: bad request, expecting an error (grouping = category, category not valid)", async () => {  
            let product = await request(app)
            .get(routePath+'/products/available')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "category", category:"bad"})
            .expect(422)
        })

        test("Getting available product list: bad request, expecting an error (grouping = category, model present)", async () => {  
            let product = await request(app)
            .get(routePath+'/products/available')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "category", model:"product1"})
            .expect(422)
        })

        test("Getting available product list: bad request, expecting an error (grouping = model, model not present)", async () => {  
            let product = await request(app)
            .get(routePath+'/products/available')
            .set("Cookie", adminCookie)
            //Either category or model has to be defined, not both
            .query({grouping: "model", model:" "})
            .expect(422)
        })

        test("Getting an available product that doesn't exist: expecting error", async () => {  
            let product = await request(app)
            .get(routePath+'/products/available')
            .set("Cookie", adminCookie)
            .query({grouping: "model", model: "fakeModel"})
            .expect(404)

        })

    })  
    
    describe("DELETE /products/:model", () => {
        test("Deleting a specific product", async () => { 
            await request(app)
            .delete(routePath+'/products/product2')
            .set("Cookie", adminCookie)
            .expect(200)
        })

        test("Deleting a product that doesn't exist, should throw an error", async () => { 
            await request(app)
            .delete(routePath+'/products/fakeModel')
            .set("Cookie", adminCookie)
            .expect(404)
        })

    })

    

    describe("DELETE /products", () => {
        test("Deleting ALL products", async () => { 
            await request(app)
            .delete(routePath+'/products')
            .set("Cookie", adminCookie)
            .expect(200)
        })

        
    })

})

