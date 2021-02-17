const Contribution = require('../models/contribution');

exports.getContributions = async (req, res) => {
    await Contribution.find({} , (err, contribution) => {
        if(err) {
            return res.status(400).json({ success: false, error: err })
        }
        if(!contribution.length) {
            return res.status(404).json({ success: false, error: 'No contributions found'})
        }
        return res.status(200).json({ success: true, data: contribution })
    }).catch(err => console.log(err))
}

exports.getRegisteredContributions = async (req, res) => {
    await Contribution.find({userID: req.params.id} , (err, contribution) => {
        if(err) {
            return res.status(400).json({ success: false, error: err })
        }
        if(!contribution.length) {
            return res.status(404).json({ success: false, error: 'No contributions found for this user'})
        }
        return res.status(200).json({ success: true, data: contribution })
    }).catch(err => console.log(err))
}

exports.getContributionDetails = async (req, res) => {
    await Contribution.find({_id: req.params.id} , (err, contribution) => {
        if(err) {
            return res.status(400).json({ success: false, error: err })
        }
        if(!contribution.length) {
            return res.status(404).json({ success: false, error: 'No contributions found for this user'})
        }
        return res.status(200).json({ success: true, data: contribution })
    }).catch(err => console.log(err))
}

exports.deleteContribution = async (req, res) => {
    await Contribution.deleteOne( { _id: req.params.id }, (err) => {
        if(err) {
            return res.status(400).json({ success: false, error: err })
        }
        return res.status(200).json({ success: true })
    })
    .catch(error => {
        return res.status(400).json({ error, message: "Error deleting contribution", })    
    })
}

exports.insertContribution = async (req, res) => {
    const body = req.body;

    if(!body) {
        return res.status(400).json({
            success: false,
            error: "You must provide a contribution",
        });
    }

    const contribution = new Contribution(body);

    if(!contribution) {
        return res.status(400).json({success: false, error: err })
    }

    contribution.save().then(() => {
        return res.status(201).json({
            success: true,
            id: contribution._id,
            message: "Contribution created",
        })
    })
    .catch(error => {
        return res.status(400).json({ error, message: "Error creating contribution", })    })
}

exports. updateContribution = async (req, res) => {
    const body = req.body;

    if(!body) {
        return res.status(400).json({
            success: false,
            error: "You must provide a contribution",
        });
    }

    console.log('body', body);

    await Contribution.findOne({_id: body.editID} , (err, contribution) => {
        if(err || !contribution) {
            return res.status(400).json({ success: false, error: 'Contribution not found' })
        }

         console.log('contribution', contribution);
         contribution.plan = body.plan;
         contribution.title = body.title;
         contribution.description = body.description;
         contribution.link = body.link;
         contribution.contact = body.contact;
     
         console.log("contribution", contribution);
         contribution.save((err, updatedContribution) => {
             if(err) {
                 console.log('UPDATED_CONTRIBUTION_ERROR', err)
                 return res.status(400).json({
                     error: 'Contribution update failed'
                 })
             }
             res.json(updatedContribution);
         });
    });
};