export default function ContactLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-8"></div>
      <div className="h-10 w-3/4 bg-muted rounded mb-8"></div>
      <div className="space-y-4">
        <div className="h-4 w-full bg-muted rounded"></div>
        <div className="h-4 w-full bg-muted rounded"></div>
        <div className="h-4 w-5/6 bg-muted rounded"></div>
        <div className="h-4 w-4/6 bg-muted rounded"></div>
      </div>
    </div>
  );
}
