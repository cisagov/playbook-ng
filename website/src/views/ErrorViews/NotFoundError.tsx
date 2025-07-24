import { Link } from "react-router-dom";
import { useTitle } from "@/hooks/useTitle";
import { Header } from "@/components/Header/Header";

/**
 * 404 Error "Page"
 *
 * - Links user back home
 * - Used as last route to match any unmatched url paths
 */
export function NotFoundError() {
  const title = "404 - Not Found";

  useTitle(title);

  return (
    <Header
      title={title}
      body={
        <p>
          Requested path is unknown: <code>{window.location.pathname}</code>
          <br />
          Please return to the <Link to="/">Home Page</Link>
        </p>
      }
    />
  );
}
