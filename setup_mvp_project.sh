#!/usr/bin/env bash
set -euo pipefail

OWNER="blrichwine"
REPO="mathml-explorer"
PROJECT_TITLE="MathML Learning Workbench MVP"
PROJECT_DESC="Track M0-M8 + QA + release for the MathML Learning Workbench"

# Create labels if missing
for l in epic mvp tracking frontend a11y editor rendering mathjax accessibility mathcat sre lint semantics diff persistence sharing latex hardening docs qa test resilience wcag release; do
  gh label create "$l" --repo "$OWNER/$REPO" --color "1f6feb" --force >/dev/null 2>&1 || true
done

create_issue() {
  local title="$1"
  shift
  local labels="$1"
  shift
  local body="$1"
  shift
  gh issue create --repo "$OWNER/$REPO" --title "$title" --label "$labels" --body "$body"
}

i2=$(create_issue "[M0] Project scaffold + state model" "mvp,frontend" "Depends on: #1")
i3=$(create_issue "[M1] Dual MathML editor (A/B) with formatting and contextual help" "mvp,editor,a11y" "Depends on: #2")
i4=$(create_issue "[M2] Native + MathJax rendering with runtime version/mode switching" "mvp,rendering,mathjax" "Depends on: #2, #3")
i5=$(create_issue "[M3] Accessibility output adapters (MathCAT WASM + SRE)" "mvp,accessibility,mathcat,sre" "Depends on: #2, #4")
i6=$(create_issue "[M4] Lint engine + intent assistant" "mvp,lint,semantics" "Depends on: #2, #3")
i7=$(create_issue "[M5] A/B output diff (same channel only)" "mvp,diff,accessibility" "Depends on: #5")
i8=$(create_issue "[M6] Persistence and share URL" "mvp,persistence,sharing" "Depends on: #2, #3, #4, #5")
i9=$(create_issue "[M7] LaTeX setup + conversion pipeline" "mvp,latex,mathjax" "Depends on: #4")
i10=$(create_issue "[M8] Hardening, performance, accessibility, docs" "mvp,hardening,docs,a11y" "Depends on: #3, #4, #5, #6, #7, #8, #9")
i11=$(create_issue "[QA] Functional test matrix" "qa,mvp,test" "Depends on: #3, #4, #5, #6, #7, #8, #9")
i12=$(create_issue "[QA] Negative-path and resilience tests" "qa,mvp,test,resilience" "Depends on: #4, #5, #6, #8, #9")
i13=$(create_issue "[QA] Accessibility and contrast verification" "qa,a11y,mvp,wcag" "Depends on: #3, #10")
i14=$(create_issue "[Release] MVP freeze and tag" "release,mvp" "Depends on: #10, #11, #12, #13")

epic_body=$(
  cat <<EOF
## Child Issues
- [ ] $i2
- [ ] $i3
- [ ] $i4
- [ ] $i5
- [ ] $i6
- [ ] $i7
- [ ] $i8
- [ ] $i9
- [ ] $i10
- [ ] $i11
- [ ] $i12
- [ ] $i13
- [ ] $i14
EOF
)
i1=$(create_issue "[Epic] MVP Delivery: MathML Learning Workbench" "epic,mvp,tracking" "$epic_body")

# Create Project (Projects v2, user scope)
project_id=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --description "$PROJECT_DESC" --format json | jq -r '.id')
project_url=$(gh project view "$project_id" --owner "$OWNER" --format json | jq -r '.url')

# Add issues to project
for u in "$i1" "$i2" "$i3" "$i4" "$i5" "$i6" "$i7" "$i8" "$i9" "$i10" "$i11" "$i12" "$i13" "$i14"; do
  gh project item-add "$project_id" --owner "$OWNER" --url "$u" >/dev/null
done

echo "Project: $project_url"
echo "Epic:    $i1"
echo "Issues:"
printf '%s\n' "$i2" "$i3" "$i4" "$i5" "$i6" "$i7" "$i8" "$i9" "$i10" "$i11" "$i12" "$i[48;26;108;884;1512t13" "$i14"
