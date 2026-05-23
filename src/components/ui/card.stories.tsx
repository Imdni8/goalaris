import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card title</CardTitle>
        <CardDescription>Supporting description goes here.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body">Card body content. Add whatever you need here.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Confirm action</CardTitle>
        <CardDescription>This action cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body">Are you sure you want to proceed?</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </CardFooter>
    </Card>
  ),
};

export const GoalCard: Story = {
  name: 'Example: Goal Card',
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Ship design system</CardTitle>
            <CardDescription>Due Jun 2026</CardDescription>
          </div>
          <span className="text-caption rounded-full bg-success/10 px-2 py-1 text-success font-medium">
            On track
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-body text-muted-foreground">
          Establish tokens, Storybook, and conventions so new features ship with consistent UI.
        </p>
      </CardContent>
    </Card>
  ),
};
