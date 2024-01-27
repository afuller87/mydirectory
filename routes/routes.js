const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs =require('fs').promises;

// image upload
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single('image');

// insert a user into database route
router.post('/add', upload, (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: req.file.filename,
    });
  
    user.save()
      .then(() => {
        req.session.message = {
          type: 'success',
          message: 'User added successfully!',
        };
        res.redirect('/');
      })
      .catch(err => {
        res.json({ message: err.message, type: 'danger' });
      });
  });

// get all users route
router.get('/', async (req, res) => {
    try {
        const users = await User.find().exec();
        res.render('index', {
            title: 'Home Page',
            users: users,
        });
    } catch(err) {
        res.json({ message: err.message });
    }
});

router.get('/add', (req, res) => {
    res.render('add_users', { title: "Add Users"});
});

// edit a user route
router.get('/edit/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let user = await User.findById(id).exec();

        if (user) {
            res.render('edit_users', {
                title: "Edit Users",
                user: user,
            });
        } else {
            res.redirect('/');
        }
    } catch (err) {
        res.redirect('/');
    }
});

// update user route
router.post('/update/:id', upload, async (req, res) => {
    let id = req.params.id;
    let new_image = '';

    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.inlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    try {
        // find the existing user by ID
        let user = await User.findById(id).exec();
        
        // update user properties
        user.name = req.body.name;
        user.email = req.body.email;
        user.phone = req.body.phone;
        
        // handle the image upload
        if (req.file) {
            user.image = req.file.filename;
        }

        // save the updated user
        await user.save();
        req.session.message = {
            type: 'success',
            message: 'User updated successfully!',
        };
        res.redirect('/');

    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

/// delete user route
router.get('/delete/:id', async (req, res) => {
    let id = req.params.id;
    try {
        let result = await User.findByIdAndDelete(id).exec();

        // if there's an associated image, delete it from the filesystem
        if (result.image) {
            await fs.unlink('./uploads/' + result.image);
        }

        req.session.message = {
            type: 'info',
            message: 'User deleted successfully!'
        };
        res.redirect('/');

    } catch (err) {
        console.log(err); 
        res.json({ message: err.message });
    }
});

module.exports = router;