const request = require("supertest")
const app = require("../app")
const Listing = require("../models/listing")

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testTokens,
  testListingIds,
} = require("../tests/common")

beforeAll(commonBeforeAll)
beforeEach(commonBeforeEach)
afterEach(commonAfterEach)
afterAll(commonAfterAll)

/************************************** GET bookings/ */
describe("GET /bookings/", () => {
  test("Authed user can fetch all bookings they've made", async () => {
    const listingId = testListingIds[0]
    const res = await request(app).get(`/bookings`).set("authorization", `Bearer ${testTokens.jloToken}`)

    expect(res.statusCode).toEqual(200)

    const { bookings } = res.body
    expect(bookings.length).toEqual(2)

    const firstBooking = bookings[bookings.length - 1]

    firstBooking.totalCost = Number(firstBooking.totalCost)

    expect(firstBooking).toEqual({
      id: expect.any(Number),
      startDate: new Date("03-05-2021").toISOString(),
      endDate: new Date("03-07-2021").toISOString(),
      paymentMethod: "card",
      guests: 1,
      username: "jlo",
      hostUsername: "lebron",
      totalCost: expect.any(Number),
      listingId: listingId,
      userId: expect.any(Number),
      createdAt: expect.any(String),
    })
  })

  test("Throws Unauthorized error when user is unauthenticated", async () => {
    const res = await request(app).get(`/bookings/`)
    expect(res.statusCode).toEqual(401)
  })
})

/************************************** GET bookings/listings */
describe("GET /bookings/listings", () => {
  test("Authed user can fetch all bookings for any listings they own", async () => {
    const res = await request(app).get(`/bookings/listings`).set("authorization", `Bearer ${testTokens.lebronToken}`)

    expect(res.statusCode).toEqual(200)

    const { bookings } = res.body
    expect(bookings.length).toEqual(2)

    const firstBooking = bookings[bookings.length - 1]

    firstBooking.totalCost = Number(firstBooking.totalCost)

    expect(firstBooking).toEqual({
      id: expect.any(Number),
      startDate: new Date("03-05-2021").toISOString(),
      endDate: new Date("03-07-2021").toISOString(),
      paymentMethod: "card",
      guests: 1,
      username: "jlo",
      hostUsername: "lebron",
      totalCost: expect.any(Number),
      listingId: expect.any(Number),
      userId: expect.any(Number),
      createdAt: expect.any(String),
    })
  })

  test("Throws Unauthorized error when user is unauthenticated", async () => {
    const res = await request(app).get(`/bookings/listings`)
    expect(res.statusCode).toEqual(401)
  })
})

describe("POST bookings/listings/:listingId", () => {
  test("Authed user can book a listing they don't own", async () => {


    const listingId = testListingIds[0]
    const data = {newBooking: {startDate:"03-24-2021", endDate:"03-29-2021", guests:10}}
    const res = await request(app).post(`/bookings/listings/${listingId}/`).set("authorization", `Bearer ${testTokens.jloToken}`).send(data)


    expect(res.statusCode).toEqual(201)


    const { booking } = res.body


    expect(booking).toEqual({
      id: expect.any(Number),
      startDate: new Date("03-24-2021").toISOString(),
      endDate: new Date("03-29-2021").toISOString(),
      paymentMethod: expect.any(String),
      guests: 10,
      hostUsername: expect.any(String),
      totalCost: expect.any(String),
      username: expect.any(String),
      listingId: listingId,
      userId: expect.any(Number),
      createdAt: expect.any(String),
    })
  })



  test("Throws a Bad Request Error when user attempts to book their own listing", async () => {
    const listingId = testListingIds[0]
    const data = {newBooking: {startDate:"06-21-2021", endDate:"06-25-2021", guests:10}}
    const res = await request(app).post(`/bookings/listings/${listingId}/`).set("authorization", `Bearer ${testTokens.lebronToken}`).send(data)
    expect(res.statusCode).toEqual(400)
  })
})

/************************************** POST bookings/listings/:listingId */

/************************************** GET bookings/listings/:listingId */
