let mockUsers = [
  {
    _id: '1',
    firstName: 'John',
    lastName: 'Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone: '+1234567890',
    role: 'user',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    _id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'janesmith',
    email: 'jane@example.com',
    phone: '+1234567891',
    role: 'restaurant',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-10T14:20:00Z'
  },
  {
    _id: '3',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    email: 'admin@example.com',
    phone: '+1234567892',
    role: 'admin',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-01T09:00:00Z'
  },
  {
    _id: '4',
    firstName: 'Restaurant',
    lastName: 'Owner',
    username: 'restaurant1',
    email: 'restaurant@example.com',
    phone: '+1234567893',
    role: 'restaurant',
    isActive: true,
    isVerified: false,
    createdAt: '2024-01-20T16:45:00Z'
  },
  {
    _id: '5',
    firstName: 'Super',
    lastName: 'Admin',
    username: 'superadmin',
    email: 'super@example.com',
    phone: '+1234567894',
    role: 'super_admin',
    isActive: true,
    isVerified: true,
    createdAt: '2023-12-01T08:00:00Z'
  },
  {
    _id: '6',
    firstName: 'Alice',
    lastName: 'Johnson',
    username: 'alicej',
    email: 'alice@example.com',
    phone: '+1234567895',
    role: 'user',
    isActive: true,
    isVerified: true,
    createdAt: '2024-02-01T11:15:00Z'
  },
  {
    _id: '7',
    firstName: 'Bob',
    lastName: 'Wilson',
    username: 'bobw',
    email: 'bob@example.com',
    phone: '+1234567896',
    role: 'user',
    isActive: false,
    isVerified: true,
    createdAt: '2024-01-25T13:30:00Z'
  },
  {
    _id: '8',
    firstName: 'Pizza',
    lastName: 'Palace',
    username: 'pizzapalace',
    email: 'pizza@example.com',
    phone: '+1234567897',
    role: 'restaurant',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-18T15:45:00Z'
  },
  {
    _id: '9',
    firstName: 'Charlie',
    lastName: 'Brown',
    username: 'charlieb',
    email: 'charlie@example.com',
    phone: '+1234567898',
    role: 'user',
    isActive: true,
    isVerified: false,
    createdAt: '2024-02-05T09:20:00Z'
  },
  {
    _id: '10',
    firstName: 'Diana',
    lastName: 'Prince',
    username: 'dianap',
    email: 'diana@example.com',
    phone: '+1234567899',
    role: 'admin',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-05T12:00:00Z'
  },
  {
    _id: '11',
    firstName: 'Burger',
    lastName: 'King',
    username: 'burgerking',
    email: 'burger@example.com',
    phone: '+1234567800',
    role: 'restaurant',
    isActive: true,
    isVerified: true,
    createdAt: '2024-01-12T14:30:00Z'
  },
  {
    _id: '12',
    firstName: 'Eve',
    lastName: 'Davis',
    username: 'eved',
    email: 'eve@example.com',
    phone: '+1234567801',
    role: 'user',
    isActive: true,
    isVerified: true,
    createdAt: '2024-02-10T16:45:00Z'
  },
  {
    _id: '13',
    firstName: 'Frank',
    lastName: 'Miller',
    username: 'frankm',
    email: 'frank@example.com',
    phone: '+1234567802',
    role: 'user',
    isActive: true,
    isVerified: true,
    createdAt: '2024-02-15T10:30:00Z'
  },
  {
    _id: '14',
    firstName: 'Grace',
    lastName: 'Lee',
    username: 'gracel',
    email: 'grace@example.com',
    phone: '+1234567803',
    role: 'restaurant',
    isActive: true,
    isVerified: false,
    createdAt: '2024-02-20T14:15:00Z'
  },
  {
    _id: '15',
    firstName: 'Henry',
    lastName: 'Clark',
    username: 'henryc',
    email: 'henry@example.com',
    phone: '+1234567804',
    role: 'user',
    isActive: false,
    isVerified: true,
    createdAt: '2024-02-25T16:45:00Z'
  }
];

export const getUsersData = () => mockUsers;

export const updateUserData = (updatedUsers) => {
  mockUsers = updatedUsers;
};

export const findUserById = (id) => {
  return mockUsers.find(user => user._id === id);
};

export const updateUserById = (id, updates) => {
  const userIndex = mockUsers.findIndex(user => user._id === id);
  if (userIndex !== -1) {
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
    return mockUsers[userIndex];
  }
  return null;
};

export const deleteUserById = (id) => {
  const userIndex = mockUsers.findIndex(user => user._id === id);
  if (userIndex !== -1) {
    return mockUsers.splice(userIndex, 1)[0];
  }
  return null;
};

export const addUser = (userData) => {
  const newUser = {
    _id: (mockUsers.length + 1).toString(),
    ...userData,
    createdAt: new Date().toISOString()
  };
  mockUsers.push(newUser);
  return newUser;
};

export const validRoles = ['user', 'restaurant', 'admin', 'super_admin'];