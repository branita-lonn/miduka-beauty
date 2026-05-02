export default function PagesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 bg-muted rounded mb-2"></div>
        <div className="h-4 w-64 bg-muted rounded"></div>
      </div>
      <div className="h-10 w-[400px] bg-muted rounded"></div>
      <div className="space-y-4">
        <div className="h-4 w-24 bg-muted rounded"></div>
        <div className="h-10 w-full bg-muted rounded"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted rounded"></div>
        <div className="h-[300px] w-full bg-muted rounded"></div>
      </div>
      <div className="h-10 w-32 bg-muted rounded"></div>
    </div>
  );
}
