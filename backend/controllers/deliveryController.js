const Delivery = require("../models/Delivery");
const Notification = require("../models/Notification");

exports.updateStatus = async (req, res) => {
    try {
        const { deliveryId, status } = req.body;

        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found" })
        }

        delivery.status = status;
        delivery.updatedAt = new Date();
        await delivery.save();

        // Notify client of status update
        const statusMessages = {
            "collected": "Item has been collected by the traveler.",
            "in_transit": "Item is in transit.",
            "arrived": "Item has arrived at the destination.",
            "delivered": "Item has been delivered successfully!"
        };

        await Notification.create({
            recipient: delivery.client,
            message: statusMessages[status]
        });

        res.status(200).json({ message: "Delivery status updated", delivery });
    } catch (error) {
        res.status(500).json({ message: "Error updating delivery status", error });
    }
};

exports.uploadProofOfDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.body;
        const proofBase64 = req.fileBase64;
        //const proofImageUrl = req.file.path; // Assuming file upload middleware is used

        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            return res.status(404).json({ message: "Delivery not found" });
        }

        //delivery.proofOfDelivery = proofImageUrl;
        delivery.proofOfDelivery = proofBase64;
        delivery.status = "delivered";
        await delivery.save();

        // Notify client
        await Notification.create({
            recipient: delivery.client,
            message: "Your product has been successfully delivered! Proof of delivery available."
        });

        res.status(200).json({ message: "Proof of delivery uploaded", delivery });
    } catch (error) {
        res.status(500).json({ message: "Error uploading proof of delivery", error });
    }
};

exports.getClientDeliveries = async (req, res) => {
    try {
        const { usersId } = req.params;
        const deliveries = await Delivery.find({ users: usersId }).populate("product traveler");

        res.status(200).json(deliveries);
    } catch (error) {
        res.status(500).json({ message: "Error fetching deliveries", error });
    }
};

