const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const {userOneId, userOne, setupDatabase} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should signup a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Andrew',
        email: 'andrew@example.com',
        password: 'Mypass777!'
    }).expect(201)

    //assert the database is changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    //assertions about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Andrew',
            email: 'andrew@example.com',
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('Mypass777!')
})

test('Should not signup user with invalid name/email/password', async () => {
    //invalid name
    await request(app)
        .post('/users')
        .send({
            email: 'mail@example.com',
            password: 'Example7878&&'
        })
        .expect(400)

    //invalid email
    await request(app)
        .post('/users')
        .send({
            name: 'Bob',
            email: 'mailAddress',
            password: 'Example7878&&'
        })
        .expect(400)

    await request(app)
        .post('/users')
        .send({
            name: 'Bob',
            password: 'Example7878&&'
        })
        .expect(400)

    //invalid password
    await request(app)
        .post('/users')
        .send({
            name: 'Bob',
            email: 'mail@example.com',
            password: 'EX123'
        })
        .expect(400)

    await request(app)
        .post('/users')
        .send({
            name: 'Bob',
            email: 'mail@example.com',
        })
        .expect(400)

})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    //assert the user get correct token
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: 'andrew@example.com',
        password: 'Mypass777!'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should delete account for user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    //assert user is actually deleted
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
    const response = await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ name: 'Bob'})
        .expect(200)
    expect(response.body.name).not.toBe(userOne.name)
})

test('Should not update invalid user field', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({ location: 'Boston'})
        .expect(400)
})

test('Should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({ name: 'Bob'})
        .expect(401)
})

test('Should not update user with invalid name/email/password', async () => {
    //invalid email
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            email: 'mailAddress'
        })
        .expect(400)

    //invalid password
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            password: '1232##'
        })
        .expect(400)
})