import { Container } from '../../layout/Container';

export const Newsletter = () => {
  return (
    <section className="py-16 border-t">
      <Container>
        <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          <p className="max-w-md text-gray-600 text-center lg:text-left">
            Subscribe to our bi-weekly email for the latest industry news,
            community updates, new product features, and beyond.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full lg:w-auto items-center sm:items-start">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 border rounded-lg w-full sm:w-80"
            />
            <button className="px-6 py-2 bg-black text-white rounded-lg w-full sm:w-auto">
              Subscribe
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}