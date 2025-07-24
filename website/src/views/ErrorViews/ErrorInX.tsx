import { Link, useRouteError } from "react-router-dom";
import { useTitle } from "@/hooks/useTitle";
import { Header } from "@/components/Header/Header";

/**
 * Error in X "Page"
 *
 * - Displays details about an error that occurred
 * - Is meant to be used as an errorElement
 *   - x="App" for root path
 *   - x="Page" for routes
 *   - It leverages useRouteError(), which wouldn't have a value outside of this
 */
export function ErrorInX(args: { x: "Page" | "App" }) {
  const { x } = args;

  const title = `Unexpected Error in ${x}`;
  useTitle(title);

  const err = useRouteError();
  const msg = `${err}`;

  return (
    <Header
      title={title}
      body={
        <p>
          Encountered error in {x}: <code>{msg}</code>
          <br />
          Please see the console for more information.
          <br />
          Please return to the <Link to="/">Home Page</Link>
        </p>
      }
    />
  );
}
