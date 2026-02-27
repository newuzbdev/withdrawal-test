import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay, setupServer } from "msw";
import WithdrawForm from "@/features/withdraw/ui/WithdrawForm";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const server = setupServer();

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("WithdrawForm", () => {
  it("submits successfully and shows success UI", async () => {
    server.use(
      http.post(`${API_BASE_URL}/v1/withdrawals`, async ({ request }) => {
        const body = (await request.json()) as any;

        return HttpResponse.json(
          {
            id: "w_123",
            amount: body.amount,
            destination: body.destination,
            status: "pending",
          },
          { status: 201 }
        );
      }),
      http.get(`${API_BASE_URL}/v1/withdrawals/:id`, ({ params }) => {
        const id = params.id as string;
        return HttpResponse.json({
          id,
          amount: 100,
          destination: "Test destination",
          status: "pending",
        });
      })
    );

    render(<WithdrawForm />);

    const amountInput = screen.getByLabelText(/amount/i);
    const destinationInput = screen.getByLabelText(/destination/i);
    const confirmCheckbox = screen.getByRole("checkbox", {
      name: /i confirm/i,
    });

    await userEvent.type(amountInput, "100");
    await userEvent.type(destinationInput, "Test destination");
    await userEvent.click(confirmCheckbox);

    const submitButton = screen.getByRole("button", {
      name: /submit withdrawal/i,
    });

    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(
        screen.getByText(/withdrawal created successfully/i)
      ).toBeInTheDocument()
    );

    expect(screen.getByText("w_123")).toBeInTheDocument();
    expect(screen.getByText("Test destination")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("shows a clear error message for API conflict (409)", async () => {
    server.use(
      http.post(`${API_BASE_URL}/v1/withdrawals`, async () => {
        return HttpResponse.json(
          { message: "Duplicate request" },
          { status: 409 }
        );
      })
    );

    render(<WithdrawForm />);

    const amountInput = screen.getByLabelText(/amount/i);
    const destinationInput = screen.getByLabelText(/destination/i);
    const confirmCheckbox = screen.getByRole("checkbox", {
      name: /i confirm/i,
    });

    await userEvent.type(amountInput, "100");
    await userEvent.type(destinationInput, "Test destination");
    await userEvent.click(confirmCheckbox);

    const submitButton = screen.getByRole("button", {
      name: /submit withdrawal/i,
    });

    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(
        screen.getByText(
          /this withdrawal request was already submitted\. please wait for status\./i
        )
      ).toBeInTheDocument()
    );
  });

  it("prevents double submit, issuing only a single POST call", async () => {
    const postSpy = vi.fn();

    server.use(
      http.post(`${API_BASE_URL}/v1/withdrawals`, async () => {
        postSpy();
        await delay(150);
        return HttpResponse.json(
          {
            id: "w_456",
            amount: 200,
            destination: "Double submit dest",
            status: "pending",
          },
          { status: 201 }
        );
      }),
      http.get(`${API_BASE_URL}/v1/withdrawals/:id`, ({ params }) => {
        const id = params.id as string;
        return HttpResponse.json({
          id,
          amount: 200,
          destination: "Double submit dest",
          status: "pending",
        });
      })
    );

    render(<WithdrawForm />);

    const amountInput = screen.getByLabelText(/amount/i);
    const destinationInput = screen.getByLabelText(/destination/i);
    const confirmCheckbox = screen.getByRole("checkbox", {
      name: /i confirm/i,
    });

    await userEvent.type(amountInput, "200");
    await userEvent.type(destinationInput, "Double submit dest");
    await userEvent.click(confirmCheckbox);

    const submitButton = screen.getByRole("button", {
      name: /submit withdrawal/i,
    });

    await Promise.all([
      userEvent.click(submitButton),
      userEvent.click(submitButton),
      userEvent.click(submitButton),
    ]);

    await waitFor(() =>
      expect(
        screen.getByText(/withdrawal created successfully/i)
      ).toBeInTheDocument()
    );

    expect(postSpy).toHaveBeenCalledTimes(1);
  });
});

