import OrganizerLayout from '../OrganizerLayout';

const TestAnalytics = () => {
  return (
    <OrganizerLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Test Analytics Page
              </h1>
              <p className="text-muted-foreground mt-1">
                This is a test page to check if the analytics routing works.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold">Test Card 1</h3>
                <p className="text-muted-foreground">This is a test card</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold">Test Card 2</h3>
                <p className="text-muted-foreground">This is a test card</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold">Test Card 3</h3>
                <p className="text-muted-foreground">This is a test card</p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-lg font-semibold">Test Card 4</h3>
                <p className="text-muted-foreground">This is a test card</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default TestAnalytics;
