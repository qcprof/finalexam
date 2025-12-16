import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] app-shell flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl font-bold text-[--color-fg] mb-4">
          Home Page
        </h1>
        <p className="text-[--color-muted] text-lg">
          Welcome to the homepage with theme colors applied
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button variant="default">Primary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="secondary">Secondary Button</Button>
        </div>
      </div>
    </div>
  )
}
