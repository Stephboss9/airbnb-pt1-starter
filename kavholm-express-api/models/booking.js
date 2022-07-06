const db = require("../db")
const { BadRequestError, NotFoundError } = require("../utils/errors")

class Booking {
  static async fetchBookingById(bookingId) {
    // fetch a single booking by its id
    const results = await db.query(
      `
      SELECT id,
             payment_method AS "paymentMethod",
             start_date AS "startDate",
             end_date AS "endDate",
             guests,
             total_cost AS "totalCost",
             listing_id AS "listingId",
             user_id AS "userId",
             -- subquery to select the username
             -- of the user who is making the booking
             (
               SELECT username
               FROM users
               WHERE id = user_id
             ) AS "username",
             -- nested subquery to select the username
             -- of the host user who owns the listing
             (
               SELECT users.username
               FROM users
               WHERE users.id = (
                 SELECT listings.user_id
                 FROM listings
                 WHERE listings.id = listing_id
               )
             ) AS "hostUsername",
             created_at AS "createdAt"
      FROM bookings
      WHERE id = $1;
      `,
      [bookingId]
    )

    const booking = results.rows[0]

    if (booking) return booking

    throw new NotFoundError("No booking found with that id.")
  }

  static async listBookingsFromUser(user) {
    // list all bookings that the user has created
    const results = await db.query(
      `
      SELECT bookings.id,
            bookings.payment_method AS "paymentMethod",
            bookings.start_date AS "startDate",
            bookings.end_date AS "endDate",
            bookings.guests,
            bookings.total_cost AS "totalCost",
            bookings.listing_id AS "listingId",
            bookings.user_id AS "userId",
            users.username AS "username",
            (
              SELECT hostUsers.username
              FROM users AS hostUsers
              WHERE hostUsers.id = (
                SELECT listings.user_id
                FROM listings
                WHERE listings.id = listing_id
              )
            ) AS "hostUsername",            
            bookings.created_at AS "createdAt"
      FROM bookings
        JOIN users ON users.id = bookings.user_id
      WHERE user_id = (SELECT id FROM users WHERE username = $1)
      ORDER BY bookings.created_at DESC;
      `,
      [user.username]
    )

    return results.rows
  }

  static async listBookingsForUserListings(user) {
    // list all bookings created for any of the listings that a user owns
    const results = await db.query(
      `
      SELECT bookings.id,
             bookings.payment_method AS "paymentMethod",
             bookings.start_date AS "startDate",
             bookings.end_date AS "endDate",
             bookings.guests,
             bookings.total_cost AS "totalCost",
             bookings.listing_id AS "listingId",
             bookings.user_id AS "userId",
             users.username AS "username",
             (
              SELECT hostUsers.username
              FROM users AS hostUsers
              WHERE hostUsers.id = (
                SELECT listings.user_id
                FROM listings
                WHERE listings.id = listing_id
              )
             ) AS "hostUsername",
             bookings.created_at AS "createdAt"
      FROM bookings
        JOIN users ON users.id = bookings.user_id
        JOIN listings ON listings.id = bookings.listing_id
      WHERE listings.user_id = (SELECT id FROM users WHERE username = $1)
      ORDER BY bookings.created_at DESC;
      `,
      [user.username]
    )

    return results.rows
  }
static async createBooking(newBooking, listing, user) {
    /**
     * CREATE TABLE bookings (
  id             SERIAL PRIMARY KEY,  
  payment_method TEXT NOT NULL,
  start_date     TIMESTAMP NOT NULL,
  end_date       TIMESTAMP NOT NULL,
  guests         INTEGER NOT NULL,
  total_cost     BIGINT NOT NULL,
  listing_id     INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

   */  

const requiredFields = ["startDate", "endDate"]
requiredFields.forEach((field) => {
  if (!newBooking?.hasOwnProperty(field)) {
    throw new BadRequestError(`Missing required field - ${field} - in request body.`)
  }
})
const payment_method = newBooking.payment_method || "card"
const guests = newBooking.guests || 1

const startDate = new Date (newBooking.startDate)
const endDate = new Date (newBooking.endDate)

const total_cost = Math.ceil(( endDate - startDate + 1) * (listing.price*1.1))

const userId = newBooking.user_id

const username = user.username

const listingId = listing.id

const results = await db.query(
`
  INSERT INTO bookings ( user_id, payment_method, start_date, end_date, guests, total_cost, listing_id)
  VALUES ((SELECT id FROM users WHERE username = $1), $2, $3, $4, $5, $6, $7)
  RETURNING id,
            user_id AS "userId",
            payment_method AS "paymentMethod",
            start_date AS "startDate",
            end_date AS "endDate",
            guests AS "guests",
            total_cost AS "totalCost",
            -- nested subquery to select the username
             -- of the host user who owns the listing
             (
               SELECT users.username
               FROM users
               WHERE users.id = (
                 SELECT listings.user_id
                 FROM listings
                 WHERE listings.id = listing_id
               )
             ) AS "hostUsername",
             listing_id AS "listingId",
             $1 AS "username",
            created_at AS "createdAt";
`,
[
username, payment_method, startDate, endDate, newBooking.guests, total_cost,  listingId,
])

return results.rows[0]
}

  

} 

module.exports = Booking
