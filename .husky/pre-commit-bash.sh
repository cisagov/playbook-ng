# This pre-commit script was written to use BASH features.
# These surpass assured POSIX functionality.
# As such, DASH/SH will error attempting to run this script.
# If POSIX compliance is desired - rewrite to avoid process substitution <() usage.

# get staged
staged_files=$(git diff --name-only --diff-filter d --staged | sort)
if [ -z "$staged_files" ]; then
  echo "Skipping entirely - no staged files"
  exit 0
fi

# prettier on intersect(staged, js|ts|jsx|tsx|css|scss|sass|html|md)
prettier_possible=$(find . -type f -regextype posix-extended -regex '\.\/[^/]+\/src\/([^/]+\/)*[^/]+\.(js|ts|jsx|tsx|css|scss|sass|html|md)' -printf '%P\n' | sort)
prettier_actual=$(comm -12 <(echo "$staged_files") <(echo "$prettier_possible"))
if [ -n "$prettier_actual" ]; then
  npm run format_args -- $prettier_actual
else
  echo "Skipping prettier - no files to run against"
fi

# eslint on intersect(staged, js|ts|jsx|tsx)
eslint_possible=$(find . -type f -regextype posix-extended -regex '\.\/[^/]+\/src\/([^/]+\/)*[^/]+\.(js|ts|jsx|tsx)' -printf '%P\n' | sort)
eslint_actual=$(comm -12 <(echo "$staged_files") <(echo "$eslint_possible"))
if [ -n "$eslint_actual" ]; then
  npm run lint_args -- $eslint_actual
else
  echo "Skipping eslint - no files to run against"
fi

# re-add staged in-case they changed
git add $staged_files
