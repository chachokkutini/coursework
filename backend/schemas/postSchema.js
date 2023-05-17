import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    tags: {
        type: Array,
        default: [],
    },
    image: {
        type: String,
    },
    likes:{
        type:Number,
        default: 0,
    },
    viewCount:{
        type:Number,
        default: 0,
      },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
      }
},
    {
        timestamps: true,
    },
);


export default mongoose.model('posts', PostSchema);