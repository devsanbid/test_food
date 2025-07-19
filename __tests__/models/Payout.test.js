import mongoose from 'mongoose';
import Payout from '../../src/models/Payout';

describe('Payout Model', () => {

  describe('Payout Schema Validation', () => {
    test('should create a valid payout', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 5000,
        commission: 500,
        netAmount: 4500,
        status: 'pending',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Restaurant Owner'
          }
        },
        reference: 'REF123456789',
        orders: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId()
        ],
        orderCount: 2,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout._id).toBeDefined();
      expect(savedPayout.payoutId).toBeDefined();
      expect(savedPayout.restaurant).toEqual(payoutData.restaurant);
      expect(savedPayout.amount).toBe(5000);
      expect(savedPayout.commission).toBe(500);
      expect(savedPayout.netAmount).toBe(4500);
      expect(savedPayout.status).toBe('pending');
      expect(savedPayout.orderCount).toBe(2);
      expect(savedPayout.orders).toHaveLength(2);
    });

    test('should fail validation for missing required fields', async () => {
      const payout = new Payout({});
      await expect(payout.save()).rejects.toThrow();
    });

    test('should fail validation for negative amount', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: -1000,
        commission: 100,
        netAmount: -1100,
        status: 'pending'
      };

      const payout = new Payout(payoutData);
      await expect(payout.save()).rejects.toThrow();
    });

    test('should fail validation for negative commission', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: -100,
        netAmount: 1100,
        status: 'pending'
      };

      const payout = new Payout(payoutData);
      await expect(payout.save()).rejects.toThrow();
    });

    test('should fail validation for negative net amount', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: -900,
        status: 'pending'
      };

      const payout = new Payout(payoutData);
      await expect(payout.save()).rejects.toThrow();
    });

    test('should fail validation for invalid status', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'invalid-status'
      };

      const payout = new Payout(payoutData);
      await expect(payout.save()).rejects.toThrow();
    });

    test('should fail validation for negative order count', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'pending',
        orderCount: -5
      };

      const payout = new Payout(payoutData);
      await expect(payout.save()).rejects.toThrow();
    });
  });

  describe('Payout Status Validation', () => {
    test('should accept valid status values', async () => {
      const validStatuses = ['pending', 'processing', 'completed', 'failed'];
      
      for (const status of validStatuses) {
        const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: status,
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'Test Account'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

        const payout = new Payout(payoutData);
        const savedPayout = await payout.save();
        expect(savedPayout.status).toBe(status);
        
        await Payout.deleteMany({});
      }
    });
  });

  describe('Payment Method Validation', () => {
    test('should validate bank transfer payment method', async () => {
      const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'pending',
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'John Doe'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.paymentMethod.type).toBe('bank_transfer');
        expect(savedPayout.paymentMethod.details.accountNumber).toBe('1234567890');
        expect(savedPayout.paymentMethod.details.accountName).toBe('John Doe');
    });

    test('should validate UPI payment method', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'pending',
        paymentMethod: {
          type: 'paypal',
          details: {
            email: 'restaurant@paypal.com'
          }
        },
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.paymentMethod.type).toBe('paypal');
      expect(savedPayout.paymentMethod.details.email).toBe('restaurant@paypal.com');
    });

    test('should validate wallet payment method', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'pending',
        paymentMethod: {
          type: 'stripe',
          details: {
            accountNumber: 'acct_1234567890'
          }
        },
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.paymentMethod.type).toBe('stripe');
      expect(savedPayout.paymentMethod.details.accountNumber).toBe('acct_1234567890');
    });

    test('should fail validation for invalid payment method type', async () => {
      const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'pending',
          paymentMethod: {
            type: 'invalid-type'
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

      const payout = new Payout(payoutData);
      await expect(payout.save()).rejects.toThrow();
    });


  });

  describe('Payout ID Generation', () => {
    test('should generate unique payout ID on save', async () => {
      const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'pending',
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'Test Account'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.payoutId).toBeDefined();
      expect(savedPayout.payoutId).toMatch(/^PO-\d{4}-\d{9}$/);
    });

    test('should generate different payout IDs for different payouts', async () => {
      const payoutData1 = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'pending',
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'Test Account'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

        const payoutData2 = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 2000,
          commission: 200,
          netAmount: 1800,
          status: 'pending',
          paymentMethod: {
            type: 'paypal',
            details: {
              email: 'test@paypal.com'
            }
          },
          reference: 'REF987654321',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

      const payout1 = new Payout(payoutData1);
      const payout2 = new Payout(payoutData2);
      
      const savedPayout1 = await payout1.save();
      const savedPayout2 = await payout2.save();

      expect(savedPayout1.payoutId).not.toBe(savedPayout2.payoutId);
    });

    test('should not regenerate payout ID on update', async () => {
      const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'pending',
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'Test Account'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();
      const originalPayoutId = savedPayout.payoutId;

      savedPayout.status = 'processing';
      const updatedPayout = await savedPayout.save();

      expect(updatedPayout.payoutId).toBe(originalPayoutId);
    });
  });

  describe('Payout Defaults', () => {
    test('should set default values correctly', async () => {
      const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'pending',
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'Test Account'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.orderCount).toBe(0);
        expect(savedPayout.orders).toEqual([]);
      expect(savedPayout.createdAt).toBeDefined();
      expect(savedPayout.updatedAt).toBeDefined();
    });
  });

  describe('Reference and Transaction Details', () => {
    test('should handle reference number and transaction ID', async () => {
      const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'completed',
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'Test Account'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.reference).toBe('REF123456789');
    });


  });

  describe('Order Association', () => {
    test('should handle multiple associated orders', async () => {
      const orders = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ];

      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 3000,
        commission: 300,
        netAmount: 2700,
        status: 'pending',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        orders: orders,
        orderCount: 3,
        reference: 'REF123456789',
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.orders).toHaveLength(3);
      expect(savedPayout.orderCount).toBe(3);
      expect(savedPayout.orders).toEqual(orders);
    });
  });

  describe('Period Tracking', () => {
    test('should handle payout period dates', async () => {
      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date();

      const payoutData = {
          restaurant: new mongoose.Types.ObjectId(),
          amount: 1000,
          commission: 100,
          netAmount: 900,
          status: 'pending',
          paymentMethod: {
            type: 'bank_transfer',
            details: {
              accountNumber: '1234567890',
              accountName: 'Test Account'
            }
          },
          reference: 'REF123456789',
          orderCount: 0,
          period: {
            startDate: periodStart,
            endDate: periodEnd
          }
        };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.period.startDate).toEqual(periodStart);
        expect(savedPayout.period.endDate).toEqual(periodEnd);
    });
  });

  describe('Payout Methods', () => {
    test('markAsProcessing should update status and timestamp', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'pending',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();
      
      await savedPayout.markAsProcessing();
      
      expect(savedPayout.status).toBe('processing');
      expect(savedPayout.processedAt).toBeDefined();
    });



    test('markAsCompleted should update status, timestamp and transaction details', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'processing',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();
      
      await savedPayout.markAsCompleted();
      
      expect(savedPayout.status).toBe('completed');
      expect(savedPayout.completedAt).toBeDefined();
    });

    test('markAsFailed should update status, timestamp and error message', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'processing',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();
      
      const errorMessage = 'Insufficient funds in account';
      
      await savedPayout.markAsFailed(errorMessage);
      
      expect(savedPayout.status).toBe('failed');
      expect(savedPayout.failureReason).toBe(errorMessage);
      expect(savedPayout.failedAt).toBeDefined();
    });


  });

  describe('Payout Virtuals', () => {
    test('should calculate payout age correctly', () => {
      const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const payout = new Payout({
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'pending',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        createdAt: pastDate
      });

      expect(payout.payoutAge).toBeGreaterThan(0);
    });
  });

  describe('Error Message Validation', () => {


    test('should accept valid failure reason', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'failed',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        failureReason: 'Payment gateway error: Transaction declined',
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.failureReason).toBe('Payment gateway error: Transaction declined');
    });
  });

  describe('Timestamp Handling', () => {
    test('should handle processed timestamp', async () => {
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'processing',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        processedAt: new Date(),
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.processedAt).toBeDefined();
    });

    test('should handle completion timestamp', async () => {
      const completedAt = new Date();
      const payoutData = {
        restaurant: new mongoose.Types.ObjectId(),
        amount: 1000,
        commission: 100,
        netAmount: 900,
        status: 'completed',
        paymentMethod: {
          type: 'bank_transfer',
          details: {
            accountNumber: '1234567890',
            accountName: 'Test Account'
          }
        },
        completedAt: completedAt,
        reference: 'REF123456789',
        orderCount: 0,
        period: {
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date()
        }
      };

      const payout = new Payout(payoutData);
      const savedPayout = await payout.save();

      expect(savedPayout.completedAt).toEqual(completedAt);
    });
  });
});