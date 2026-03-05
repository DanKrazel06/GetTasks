export class CreateTaskDto {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'DEVELOPMENT' | 'DESIGN' | 'QA' | 'DEVOPS' | 'DOCUMENTATION';
  dueDate: string;
  estimatedHours: number;
}
