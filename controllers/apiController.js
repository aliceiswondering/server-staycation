const Item = require("../models/Item");
const Treasure = require("../models/Activity");
const Traveler = require("../models/Booking");
const Category = require("../models/Category");
const Bank = require("../models/Bank");
const Booking = require("../models/Booking");
const Member = require("../models/Member");

module.exports = {
  landingPage: async (req, res) => {
    try {
      const mostpicked = await Item.find()
        .select("_id title country city price unit imageId")
        .limit(5)
        .populate({
          path: "imageId",
          select: "_id imageUrl",
          perDocumentLimit: 1,
        });

      const traveler = await Traveler.find();
      const treasure = await Treasure.find();
      const city = await Item.find();
      const categories = await Category.find()
        .select("_id name itemId")
        .limit(3)
        .populate({
          path: "itemId",
          select: "_id title country city isPopular sumBooking imageId",
          perDocumentLimit: 4,
          options: { sort: { sumBooking: -1 } },
          populate: {
            path: "imageId",
            select: "_id imageUrl",
            perDocumentLimit: 1,
          },
        });
      for (let i = 0; i < categories.length; i++) {
        for (let j = 0; j < categories[i].itemId.length; j++) {
          const item = await Item.findOne({ _id: categories[i].itemId[j]._id });
          item.isPopular = false;
          await item.save();
          if (categories[i].itemId[0] === categories[i].itemId[j]) {
            item.isPopular = true;
            await item.save();
          }
        }
      }
      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: "/images/testimonial2.jpg",
        name: "Happy Family",
        rate: 4.55,
        content:
          "What a great trip with my family and I should try again next time soon ...",
        familyName: "Angga",
        familyOccupation: "Product Designer",
      };

      res.status(200).json({
        hero: {
          travelers: traveler.length,
          treasures: treasure.length,
          cities: city.length,
        },
        mostpicked,
        categories,
        testimonial,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  },
  detailPage: async (req, res) => {
    try {
      const { id } = req.params;
      const item = await Item.findOne({ _id: id })
        .populate({
          path: "imageId",
          select: "_id imageUrl",
        })
        .populate({
          path: "featureId",
          select: "_id name qty imageUrl",
        })
        .populate({
          path: "activityId",
          select: "_id name type imageUrl",
        });

      const bank = await Bank.find();

      const testimonial = {
        _id: "asd1293uasdads1",
        imageUrl: "/images/testimonial1.jpg",
        name: "Happy Family",
        rate: 4.55,
        content:
          "What a great trip with my family and I should try again next time soon ...",
        familyName: "Angga",
        familyOccupation: "Product Designer",
      };
      res.status(200).json({
        ...item._doc,
        bank,
        testimonial,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  },

  bookingPage: async (req, res) => {
    const {
      itemId,
      duration,
      bookingStartDate,
      bookingEndDate,
      firstName,
      lastName,
      email,
      phoneNumber,
      accountHolder,
      bankFrom,
    } = req.body;

    if (!req.file) {
      return res.status(404).json({ message: "Image not found!" });
    }
    if (
      itemId === undefined ||
      duration === undefined ||
      bookingStartDate === undefined ||
      bookingEndDate === undefined ||
      firstName === undefined ||
      lastName === undefined ||
      email === undefined ||
      phoneNumber === undefined ||
      accountHolder === undefined ||
      bankFrom === undefined
    ) {
      return res.status(404).json({ message: "Complete all the field!" });
    }

    const item = await Item.findOne({ _id: itemId });

    if (!item) {
      return res.status(404).json({ message: "Item not found!" });
    }

    item.sumBooking += 1;
    await item.save();

    let total = item.price * duration;
    let tax = total * 0.1;

    const invoice = Math.floor(1000000 + Math.random() * 9000000);

    const member = await Member.create({
      firstName,
      lastName,
      email,
      phoneNumber,
    });

    const newBooking = {
        invoice,
        bookingStartDate,
        bookingEndDate,
        total : total += tax,
        itemId : {
            _id : item.id,
            title : item.title,
            price : item.price,
            duration : duration,
        },
        memberId: member.id,
        payments: {
            proofPayment: `images/${req.file.filename}`,
            bankFrom : bankFrom, 
            accountHolder: accountHolder,
        }
    };

    const booking = await Booking.create(newBooking);

    res.status(201).json({ message: "success booking", booking });
  },
};
