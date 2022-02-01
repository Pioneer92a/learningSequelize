/* eslint-disable no-underscore-dangle */
/* eslint-disable linebreak-style */
const express = require('express');
const Sequelize = require('sequelize');

const { Op } = Sequelize; // Op = Sequelize.Op

const _USERS = require('./users.json');

const app = express();
const port = 8001;

//
const _logging = false;
const _force = true;

// create a new Sequelize instance that uses sqlite
const connection = new Sequelize('db', 'user', 'pass', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: 'db.sqlite',
  logging: _logging, // dont display sql data onto console
  define: {
    freezeTableName: false, // table name matches model name
    timestamps: false,
    hooks: { // hooks: lifecycle events called before and after events in sequelize
      beforeValidate: () => { // called before validate
        // console.log('before validate');
      },
      afterValidate: () => {
        // console.log('after validate');
      },
      beforeCreate: () => {
        // console.log('before create');
        // eslint-disable-next-line no-param-reassign
        // user.full_name = `${user.first} ${user.last}`;
      },
      afterCreate: () => {
        // console.log('after create');
      },
    },
  },
});

// create a model, that will later be turned into a table trhough sync method
const User = connection.define('User', {
  name: Sequelize.STRING,
  email: {
    type: Sequelize.STRING,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: Sequelize.STRING,
    validate: {
      isAlphanumeric: true,
    },
  },
});

// create another model
const Post = connection.define('Post', {
  title: Sequelize.STRING,
  content: Sequelize.TEXT,
});

// create a model called comment
const Comment = connection.define('Comment', {
  the_comment: Sequelize.STRING,
});

// create a model called Project
const Project = connection.define('Project', {
  title: Sequelize.STRING,
});

app.put('/update', (req, res) => {
  User.update({
    name: 'Michaels',
  }, {
    where: { id: 55 },
  })
    .then((rows) => {
      res.json(rows);
    })
    .catch((err) => {
      res.status(404).send(err);
    });
});

app.delete('/remove', (req, res) => {
  User.destroy({
    where: { id: 50 },
  })
    .then(() => {
      res.json('successful deletion !!');
    })
    .catch((err) => {
      res.status(404).send(err);
    });
});

app.get('/findOne', (req, res) => {
  User.findByPk(55)
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      res.status(404).send(err);
    });
});

app.get('/allposts', (req, res) => {
  User.findAll({ // include User in post query
    attributes: ['name'], // only show names
    include: [{
    //   model: User,
    // }, {
      model: Project,
      attributes: ['title'],
    }],
  })
    .then((output) => {
      res.json(output);
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send(err);
    });
});

app.get('/singlepost', (req, res) => {
  Post.findByPk('1', {
    include: [{
      model: Comment,
    }, {
      model: User,
    }],
  })
    .then((posts) => {
      res.json(posts);
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send(err);
    });
});

app.put('/addworker', (req, res) => {
  Project.findByPk(2)
    .then((project) => {
      project.addUsers(5); // add UserId '5' to ProjectId 2
    })
    .then(() => {
      res.send('User Added');
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send(err);
    });
});

// ASSOSCIATIONS
// Post.belongsTo(User, { as: 'UserRef', foreinKey: 'userId' });
// User.hasOne(Post);
Post.belongsTo(User);
// ^ puts foreignKey UserId in Post Table, that relates to User database primary key
// foreignKey is automatically generated for us that joins Use with Post
Post.hasMany(Comment); // a post can have many comments
// foreignKey of PostId will be placed in Comment Table

// creates a userProjects table with IDs for ProjectId and UserId
User.belongsToMany(Project, { through: 'UserProjects' });
Project.belongsToMany(User, { through: 'UserProjects' });

connection
  .sync({ // create the table
    force: _force, // drop my table and recreate it
  })
  .then(() => {
    Project.create({
      title: 'project 1',
    }).then((project) => {
      project.setUsers([4, 5]); // projectId 1 will be associated with UserId 4 and 5
    });
  })
  .then(() => {
    Project.create({
      title: 'project 2',
    });
  })
  .then(() => {
    User.bulkCreate(_USERS)
      .then(() => {
        console.log('success adding users');
      })
      .catch((err) => {
        console.log('errorX:', err);
      });
  })
  .then(() => {
    Post.create({
      UserId: 1,
      title: 'first post',
      content: 'post content 1',
    });
  })
  .then(() => {
    Post.create({
      UserId: 2,
      title: 'second post',
      content: 'post content 2',
    });
  })
  .then(() => {
    Comment.create({
      PostId: 1,
      the_comment: 'first comment',
    });
  })
  .then(() => {
    Comment.create({
      PostId: 1,
      the_comment: 'second comment',
    });
  })
  .then(() => {
    console.log('Connection to database successful');
  })
  .catch((err) => {
    console.error('Unable to connect to database', err);
  });

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
