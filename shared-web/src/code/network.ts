type Good<T> = {
  ok: true;
  data: T;
};

type FailType =
  | "Network Issue"
  | "Resource Missing"
  | "HTTP Error"
  | "Not JSON";

type Fail = {
  ok: false;
  type: FailType;
};

type Result<T> = Good<T> | Fail;

function good<T>(data: T): Good<T> {
  return { ok: true, data };
}

function fail(type: FailType): Fail {
  return { ok: false, type };
}

const REQ_INIT = { headers: { Accept: "application/json" } };

/**
 * GET JSON from url as Type T
 *
 * - Returns a promise that always resolves / is await-able without try-catch
 * - Promise gives a Result\<T\> that denotes success in .ok bool field
 * - Good has .data: T
 * - Fail has .type to describe failure mode encountered
 */
export async function getJson<T>(url: string | URL): Promise<Result<T>> {
  let resp = null;
  try {
    resp = await fetch(url, REQ_INIT);
  } catch {
    return fail("Network Issue");
  }

  if (!resp.ok) {
    if (resp.status === 404) {
      return fail("Resource Missing");
    } else {
      return fail("HTTP Error");
    }
  }

  let data = null;
  try {
    data = await resp.json();
  } catch {
    return fail("Not JSON");
  }

  return good(data as T);
}
