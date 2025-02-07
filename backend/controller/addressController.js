const AddressSchema = require("../model/addressModel")
const addAddress = async(req,res)=>{
    try{
        console.log('User from auth middleware:', req.user); // Add this
        console.log('Request body:', req.body); // Add this
        const userId=req.user.data._id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID not found"
            });
        }
        const {
            address_type,
            full_name,
            phone_number,
            street_address,
            apartment,
            city,
            state,
            country,
            postal_code,
            is_default,
            lanmark

        }=req.body
        
        if (!full_name || !phone_number || !street_address || !city || !state || !country || !postal_code) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }

        const addresscount= await AddressSchema.countDocuments({user:userId})
        const shouldBeDefault= addresscount===0?true:is_default

        if (shouldBeDefault) {
            await AddressSchema.updateMany(
                { user: userId, is_default: true },
                { $set: { is_default: false } }
            );
        }

        const newAddressSchema= new AddressSchema(
            {
                user:userId,
                address_type:address_type||"home",
                full_name:full_name,
                phone_number:phone_number,
                street_address:street_address,
                apartment:apartment,
                city:city,
                state:state,
                country:country,
                postal_code:postal_code,
                is_default:shouldBeDefault,
                lanmark:lanmark
            }
        )
        const savedAddress = await newAddressSchema.save()
        res.status(201).json({
            success: true,
            message: "Address created successfully",
            data:savedAddress
        })

    }
    catch(error){
        console.log("Add address Error:",error)
        if(error.code===11000){
            return res.status(400).json({
                success: false,
                message: "Address already exists"
            })
        }
        console.error('Detailed error:', error); // Add this
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"

        })
    }
}

const editAddress = async (req, res) => {
    try {
        const userId = req.user.data._id; // Changed to match JWT structure
        const addressId = req.params.id;

        // Validate addressId format
        if (!addressId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID format'
            });
        }

        const updateData = req.body;

        // Prevent updating the user field
        delete updateData.user;

        // If setting as default, remove default from other addresses
        if (updateData.is_default) {
            await AddressSchema.updateMany(
                { user: userId, is_default: true },
                { $set: { is_default: false } }
            );
        }

        const updatedAddress = await AddressSchema.findOneAndUpdate(
            { _id: addressId, user: userId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({
                success: false,
                message: 'Address not found or unauthorized'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            address: updatedAddress
        });

    } catch (error) {
        console.error('Edit Address Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You already have a default address'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update address',
            error: error.message
        });
    }
};

const deleteAddress = async (req, res) => {
    try {
        const userId = req.user.data._id; // Changed to match JWT structure
        const addressId = req.params.id;
        // Validate addressId format
        if (!addressId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID format'
            });
        }

        // Find the address to be deleted
        const addressToDelete = await AddressSchema.findOne({ 
            _id: addressId, 
            user: userId 
        });

        if (!addressToDelete) {
            return res.status(404).json({
                success: false,
                message: 'Address not found or unauthorized'
            });
        }

        await addressToDelete.deleteOne();

        // If deleted address was default, set a new default
        if (addressToDelete.is_default) {
            const remainingAddress = await AddressSchema.findOne({ user: userId });
            if (remainingAddress) {
                remainingAddress.is_default = true;
                await remainingAddress.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully'
        });

    } catch (error) {
        console.error('Delete Address Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
            error: error.message
        });
    }
};

const getAddresses = async (req, res) => {
    try {
      const userId = req.user.data._id;
      const addresses = await AddressSchema.find({ user: userId });
      res.status(200).json(addresses);
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ message: 'Error fetching addresses' });
    }
  };

module.exports={addAddress,editAddress,deleteAddress,getAddresses}