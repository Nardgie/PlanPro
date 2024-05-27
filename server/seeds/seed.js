const mongoose = require('mongoose');
const { Conference, Session, User } = require('../models');
const seedData = require('./seedData');

mongoose.connect('mongodb://localhost:27017/googlebooks', { useNewUrlParser: true, useUnifiedTopology: true });

async function seedDatabase() {
  try {
    await mongoose.connection.dropDatabase();

    // Insert conferences and store their IDs
    const insertedConferences = await Conference.insertMany(seedData.conferences);
    const conferenceMap = insertedConferences.reduce((map, conf) => {
      map[conf.name] = conf._id;
      return map;
    }, {});

    // Update sessions to include the correct conferenceId
    const sessionsWithConferenceId = seedData.sessions.map(session => {
      if (session.name.startsWith('Modern CSS Techniques') || session.name.startsWith('Advanced JavaScript Patterns') || session.name.startsWith('Building Responsive Websites') || session.name.startsWith('Web Security Essentials') || session.name.startsWith('Progressive Web Apps') || session.name.startsWith('Deploying Web Applications')) {
        session.conferenceId = conferenceMap['Web Dev Summit 2024'];
      } else if (session.name.startsWith('JavaScript ES2024 Features') || session.name.startsWith('Node.js Performance Tuning') || session.name.startsWith('React State Management') || session.name.startsWith('Testing JavaScript Applications') || session.name.startsWith('Building RESTful APIs with Express') || session.name.startsWith('Serverless Functions with AWS Lambda')) {
        session.conferenceId = conferenceMap['JavaScript Con 2024'];
      } else if (session.name.startsWith('Mastering Webpack') || session.name.startsWith('CSS Grid Layouts') || session.name.startsWith('Accessibility in Web Design') || session.name.startsWith('JavaScript Frameworks Comparison') || session.name.startsWith('Animations with CSS and JavaScript') || session.name.startsWith('Web Development with Vue.js')) {
        session.conferenceId = conferenceMap['Frontend Masters 2024'];
      }
      return session;
    });

    // Insert sessions
    await Session.insertMany(sessionsWithConferenceId);

    // Insert users and reference session IDs
    const userPromises = seedData.users.map(user => {
      user.savedSessions = sessionsWithConferenceId.map(session => session._id);
      return new User(user).save();
    });
    await Promise.all(userPromises);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
