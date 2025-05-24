const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['guest', 'user', 'premium', 'admin'],
    default: 'user'
  },
  smokingStatus: {
    cigarettesPerDay: {
      type: Number,
      default: 0
    },
    costPerPack: {
      type: Number,
      default: 0
    },
    smokingFrequency: {
      type: String,
      default: ''
    },
    healthStatus: {
      type: String,
      default: ''
    },
    cigaretteType: {
      type: String,
      default: ''
    },
    quitReason: {
      type: String,
      default: ''
    },
    dailyLog: [{
      date: {
        type: Date,
        default: Date.now
      },
      cigarettes: {
        type: Number,
        default: 0
      },
      feeling: String,
      triggers: [String],
      notes: String
    }],
    healthImprovements: [{
      date: {
        type: Date,
        default: Date.now
      },
      improvement: String,
      notes: String
    }]
  },
  quitPlan: {
    planType: {
      type: String,
      enum: ['gradual', 'cold-turkey', 'custom'],
      default: 'gradual'
    },
    startDate: {
      type: Date
    },
    targetDate: {
      type: Date
    },
    initialCigarettes: {
      type: Number,
      default: 0
    },
    dailyReduction: {
      type: Number,
      default: 1
    },
    milestones: [{
      title: String,
      date: Date,
      completed: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        enum: ['time', 'money', 'health'],
        default: 'time'
      },
      value: Number,
      description: String
    }],
    currentProgress: {
      type: Number,
      default: 0
    },
    dailyProgress: [{
      date: {
        type: Date,
        default: Date.now
      },
      cigarettes: Number,
      moneySaved: Number,
      notes: String,
      mood: {
        type: String,
        enum: ['great', 'good', 'okay', 'bad', 'terrible'],
        default: 'okay'
      }
    }]
  },
  achievements: [{
    title: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['time', 'money', 'health', 'streak'],
      default: 'time'
    },
    value: Number,
    icon: String,
    shared: {
      type: Boolean,
      default: false
    }
  }],
  notifications: [{
    title: String,
    message: String,
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['milestone', 'motivation', 'health', 'reminder'],
      default: 'milestone'
    },
    read: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Để so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;