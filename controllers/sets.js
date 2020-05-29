const path = require('path');
const Set = require('../models/Set');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
var fs = require('fs');

// @desc Get all sets
// @route GET /api/v1/sets
// @access Public

exports.getSets = async (req, res, next) => {
    try {
        let query;

        // copy req.Query
        const reqQuery = {...req.Query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];

        //Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        console.log(reqQuery);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);
        
        // create operators ($gt, gte, etc)
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|eq)\b/g, match => `$${match}`)

        if (!req.query.tag) {
            query = Set.find(JSON.parse(queryStr)).populate('photographer').populate('models');
        }

        if (req.query.tag) {
            query = Set.find({"tag": req.query.tag}).populate('photographer').populate('models');
        }

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
                query = query.select(fields)
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy)
        } else {
            query = query.sort('-createdAt');
        }

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Set.countDocuments();

        query = query.skip(startIndex).limit(limit);

        // Pagination result
        const pagination = {}
        
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }

        if (startIndex > 0) {
           pagination.prev = {
               page: page - 1,
               limit
           } 
        }

        const sets = await query;

        res.status(200).json({ success: true, count: sets.length, pagination: pagination, data: sets}) 

    } catch(err) {
        next(err);
    }
}


// @desc Get one set
// @route GET /api/v1/sets/:id
// @access Public

exports.getSet = async (req, res, next) => {
    try {
        const set = await Set.findById(req.params.id);
        if (!set) {
            next(new ErrorResponse(`Set not found with id of ${req.params.id}`), 404);
        }
        res.status(200).json({success: true, data: set});
    } catch(err) {
        next(err);
    }
}

// @desc Create new set
// @route POST /api/v1/sets/
// @access Private 

exports.createSet = async (req, res, next) => {
    try {
        // req.body.photographer = req.user.id;
        
        const set = await Set.create(req.body);
    
        res.status(201).json({
            sucess: true,
            data: set
        });
    }
    catch(err) {
        next(err);
    }
}

// @desc Update set
// @route PUT /api/v1/sets/:id
// @access Private 

exports.updateSet = async (req, res, next) => {
    try {
        
        let set = await Set.findById(req.params.id);
        if (!set) {
            next(new ErrorResponse(`Set not found with id of ${req.params.id}`), 404);
        }

        // Make sure user is set photographer
        if (set.photographer.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(ErrorResponse(`User ${req.user.id} is not authorized to update this set`, 401))
        }

        set = await Set.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        

        res.status(200).json({success: true, data: set})
    } catch(err) {
        next(err);
    }
}


// @desc Delete set
// @route DELETE /api/v1/sets/:id
// @access Private 

exports.deleteSet = async (req, res, next) => {
    try {

        const set = await Set.findByIdAndDelete(req.params.id)
        
        if (!set) {
            next(new ErrorResponse(`Set not found with id of ${req.params.id}`), 404);
        }

        // Make sure user is set photographer
        if (set.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(ErrorResponse(`User ${req.user.id} is not authorized to delete this set`, 401))
        }

        set.remove();
        res.status(200).json({success: true, data: {}})
    
    } catch(err) {
        next(err);
    }
}

// @desc Upload main picture
// @route PUT /api/v1/sets/:id
// @access Private

exports.setUploadMainPic = async (req, res, next) => {
    try {
        const set = await Set.findById(req.params.id)
        if (!set) {
            next(new ErrorResponse(`Set not found with id of ${req.params.id}`), 404);
        }
        if (!req.files) {
            return next(new ErrorResponse(`Please upload a file`, 400))
        }

        const file = req.files.file

        console.log(file);

        // Make sure that the file is a photo
        if (!file.mimetype.startsWith('image')) {
            return next(new ErrorResponse(`Please upload an image file`, 400))
        }

        // Check file size
        if (file.size > process.env.MAX_FILE_UPLOAD) {
            return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD} `, 400))
        }

        // create custom name
        file.name = `main_pic_${set._id}${path.parse(file.name).ext}`

        // Make sure picture has jpg extension
        // if (!file.name.includes('.jpg') || !file.name.includes('.JPG') || !file.name.includes('jpeg')) {
        //     return next(new ErrorResponse(`Please upload an image with jpg extension`, 400))
        // }

        const dir_main = `${process.env.FILE_UPLOAD_PATH}/sets/${set._id}/main_pic`

        if (!fs.existsSync(dir_main)){
            fs.mkdirSync(dir_main, {recursive: true}, err => {});
        }
        
        file.mv(`${dir_main}/${file.name}`, async(error) => {
            if (error) {
                return next(new ErrorResponse(`Problem with the file apload `, 500))
            }
            await Set.findByIdAndUpdate(req.params.id, {mainPicture: file.name});
            res.status(200).json({
                success: true,
                data: file.name
            }) 
        })
    } catch(err) {
        next(err);
    }
}

exports.setUploadFreePics = async (req, res, next) => {
    try {
        const set = await Set.findById(req.params.id)
        if (!set) {
            next(new ErrorResponse(`Set not found with id of ${req.params.id}`), 404);
        }
        if (!req.files) {
            return next(new ErrorResponse(`Please upload a file`, 400))
        }

        const files = req.files

        console.log(files, 'files');

        // Make sure there are three free pictures uploaded
        if (files.file.length !== 3) {
            return next(new ErrorResponse(`Please upload three files`, 400))
        }

        files.file.forEach((pic, i) => {
           
            // Make sure that the file is a photo
            if (!pic.mimetype.startsWith('image')) {
                return next(new ErrorResponse(`Please upload an image file`, 400))
            }

            // Check file size
            if (pic.size > process.env.MAX_FILE_UPLOAD) {
                return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD} `, 400))
            }

            // create custom name
            pic.name = `free_pic_${set._id}_${i}${path.parse(pic.name).ext}`

            // Make sure picture has jpg extension
            // if (!file.name.includes('.jpg') || !file.name.includes('.JPG')) {
            //     return next(new ErrorResponse(`Please upload an image with jpg extension`, 400))
            // }

            const dir = `${process.env.FILE_UPLOAD_PATH}/sets/${set._id}`

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, {recursive: true}, err => {});
            }

            const dir_free = `${process.env.FILE_UPLOAD_PATH}/sets/${set._id}/free_pics`

            if (!fs.existsSync(dir_free)){
                fs.mkdirSync(dir_free, {recursive: true}, err => {});
            }

            pic.mv(`${dir_free}/${pic.name}`, async(error) => {
                if (error) {
                    return next(new ErrorResponse(`Problem with the file apload `, 500))
                }
                await Set.findByIdAndUpdate({_id: req.params.id}, {$push: {freePictures: pic.name}});
            })
        });
        res.status(200).json({
            success: true
        }) 
        
    } catch(err) {
        next(err);
    }
}

exports.setUploadPremiumPics = async (req, res, next) => {
    try {
        const set = await Set.findById(req.params.id)
        if (!set) {
            next(new ErrorResponse(`Set not found with id of ${req.params.id}`), 404);
        }
        if (!req.files) {
            return next(new ErrorResponse(`Please upload a file`, 400))
        }

        const files = req.files

        console.log(files, 'files');

        // Make sure there are three free pictures uploaded
        if (files.file.length !== 8) {
            return next(new ErrorResponse(`Please upload eight files`, 400))
        }

        files.file.forEach((pic, i) => {
           
            // Make sure that the file is a photo
            if (!pic.mimetype.startsWith('image')) {
                return next(new ErrorResponse(`Please upload an image file`, 400))
            }

            // Check file size
            if (pic.size > process.env.MAX_FILE_UPLOAD) {
                return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD} `, 400))
            }

            // create custom name
            pic.name = `premium_pic_${set._id}_${i}${path.parse(pic.name).ext}`

            // Make sure picture has jpg extension
            // if (!file.name.includes('.jpg') || !file.name.includes('.JPG')) {
            //     return next(new ErrorResponse(`Please upload an image with jpg extension`, 400))
            // }

            const dir = `${process.env.FILE_UPLOAD_PATH}/sets/${set._id}`

            if (!fs.existsSync(dir)){
                fs.mkdirSync(dir, {recursive: true}, err => {});
            }
            
            const dir_premium = `${process.env.FILE_UPLOAD_PATH}/sets/${set._id}/premium_pics`

            if (!fs.existsSync(dir_premium)){
                fs.mkdirSync(dir_premium, {recursive: true}, err => {});
            }

            pic.mv(`${dir_premium}/${pic.name}`, async(error) => {
                if (error) {
                    return next(new ErrorResponse(`Problem with the file apload `, 500))
                }
                await Set.findByIdAndUpdate({_id: req.params.id}, {$push: {pictures: pic.name}});
            })
        });
        res.status(200).json({
            success: true
        }) 
        
    } catch(err) {
        next(err);
    }
}