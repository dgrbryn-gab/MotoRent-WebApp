import { useState } from 'react';
import { Calendar, DollarSign, Bike, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Reservation } from '../App';

interface TransactionsPageProps {
  reservations?: Reservation[];
  transactions?: any[];
}

export function TransactionsPage({ reservations = [], transactions = [] }: TransactionsPageProps) {
  // If we have reservations, use them for rental history; otherwise fall back to empty state
  const rentalHistoryData = reservations || [];
  
  // Filter only completed reservations
  const completedRentals = rentalHistoryData.filter(r => r.status === 'completed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate total spent on completed rentals
  const totalSpent = completedRentals.reduce((sum, rental) => sum + rental.totalPrice, 0);

  // Calculate number of days rented
  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-primary mb-2">Rental History</h1>
        <p className="text-muted-foreground">View all your completed motorcycle rentals</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rentals</p>
                <p className="text-2xl text-primary font-semibold">{completedRentals.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Bike className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount Spent</p>
                <p className="text-2xl text-green-600 font-semibold">₱{totalSpent.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rental Cost</p>
                <p className="text-2xl text-orange-600 font-semibold">
                  ₱{completedRentals.length > 0 ? Math.round(totalSpent / completedRentals.length).toLocaleString() : '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental History List */}
      <Card>
        <CardHeader>
          <CardTitle>Completed Rentals</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {completedRentals.length > 0 ? (
            completedRentals.map((rental, index) => {
              const daysRented = calculateDays(rental.startDate, rental.endDate);
              return (
                <div key={rental.id}>
                  <div className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex gap-4">
                      {/* Motorcycle Image */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={rental.motorcycle.image}
                          alt={rental.motorcycle.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Rental Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{rental.motorcycle.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{rental.motorcycle.type}</p>
                            
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Pick-up Date</p>
                                <p className="text-sm font-medium">{formatDate(rental.startDate)}</p>
                                {rental.pickupTime && (
                                  <p className="text-xs text-muted-foreground">{rental.pickupTime}</p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Return Date</p>
                                <p className="text-sm font-medium">{formatDate(rental.endDate)}</p>
                                {rental.returnTime && (
                                  <p className="text-xs text-muted-foreground">{rental.returnTime}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {daysRented} {daysRented === 1 ? 'day' : 'days'}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                                Completed
                              </Badge>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
                            <p className="text-2xl font-bold text-green-600">₱{rental.totalPrice.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-2">💵 Cash</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < completedRentals.length - 1 && <Separator />}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <Bike className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Completed Rentals</h3>
              <p className="text-muted-foreground">
                Your completed rental history will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}