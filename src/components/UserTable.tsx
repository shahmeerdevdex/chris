
import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  UserX, 
  Clock, 
  Edit, 
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { User, UserStatus } from '@/lib/types';
import { formatDate, getUserStatusColor } from '@/lib/data';

interface UserTableProps {
  users: User[];
  onDelete: (userId: string) => void;
  onStatusChange: (userId: string, newStatus: UserStatus) => void;
}

const UserTable = ({ users, onDelete, onStatusChange }: UserTableProps) => {
  const [visibleRows, setVisibleRows] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(users.length / rowsPerPage);

  useEffect(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    setVisibleRows(users.slice(startIndex, endIndex));
  }, [users, currentPage]);

  const handleDelete = (userId: string) => {
    toast.success('User deleted successfully');
    onDelete(userId);
  };

  const handleStatusChange = (userId: string, newStatus: UserStatus) => {
    toast.success(`User status changed to ${newStatus}`);
    onStatusChange(userId, newStatus);
  };

  const renderUserSubscription = (user: User) => {
    if (user.subscriptionInterval && user.subscriptionAmount > 0) {
      return `$${user.subscriptionAmount}/${user.subscriptionInterval === 'monthly' ? 'mo' : 'yr'}`;
    }
    return 'No subscription';
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Trial Ends</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((user) => (
              <TableRow key={user.id} className="animate-slide-up" style={{animationDelay: '50ms'}}>
                <TableCell className="font-medium">
                  <div>
                    <div>{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserStatusColor(user.status)}`}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>{renderUserSubscription(user)}</TableCell>
                <TableCell>{user.trialEndsAt ? formatDate(user.trialEndsAt) : 'N/A'}</TableCell>
                <TableCell>{formatDate(user.lastActive)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit user</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'active')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        <span>Make active</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'trial')}>
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Start trial</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'expired')}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        <span>Set as expired</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'cancelled')}>
                        <UserX className="mr-2 h-4 w-4" />
                        <span>Cancel subscription</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600" 
                        onClick={() => handleDelete(user.id)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        <span>Delete user</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserTable;
