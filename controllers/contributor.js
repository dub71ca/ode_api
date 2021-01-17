const Contributor = require('../models/contributor');

exports.getContributors = async (req, res) => {
    await Contributor.find({} , (err, contributor) => {
        if(err) {
            return res.status(400).json({ success: false, error: err })
        }
        if(!contributor.length) {
            return res.status(404).json({ success: false, error: 'No contributors found'})
        }
        return res.status(200).json({ success: true, data: contributor })
    }).catch(err => console.log(err))
}

exports.getRegisteredContributions = async (req, res) => {
    await Contributor.find({userID: req.params.id} , (err, contributor) => {
        if(err) {
            return res.status(400).json({ success: false, error: err })
        }
        if(!contributor.length) {
            return res.status(404).json({ success: false, error: 'No contributors found for this user'})
        }
        return res.status(200).json({ success: true, data: contributor })
    }).catch(err => console.log(err))
}

exports.insertContributor = async (req, res) => {
    const body = req.body;

    if(!body) {
        return res.status(400).json({
            success: false,
            error: "You must provide a contribution",
        });
    }

    const contributor = new Contributor(body);

    if(!contributor) {
        return res.status(400).json({success: false, error: err })
    }

    contributor.save().then(() => {
        return res.status(201).json({
            success: true,
            id: contributor._id,
            message: "Contributor created",
        })
    })
    .catch(error => {
        return res.status(400).json({ error, message: "Error creating contributor", })    })
}