/**
 * Parses Playwright JSON output and generates a clean reports.json
 *
 * Usage: npx tsx tests/helpers/report-generator.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const INPUT_FILE = path.resolve(__dirname, '../../playwright-results.json');
const OUTPUT_FILE = path.resolve(__dirname, '../../reports.json');

interface PwSuite {
  title: string;
  file: string;
  suites?: PwSuite[];
  specs?: PwSpec[];
}

interface PwSpec {
  title: string;
  ok: boolean;
  tests: PwTest[];
}

interface PwTest {
  status: string;
  results: PwResult[];
}

interface PwResult {
  status: string;
  duration: number;
  errors: PwError[];
}

interface PwError {
  message: string;
  stack?: string;
}

interface ReportEntry {
  file: string;
  suite: string;
  test: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration_ms: number;
  error: string | null;
}

function extractTests(suite: PwSuite, parentSuite = ''): ReportEntry[] {
  const entries: ReportEntry[] = [];
  const suiteName = parentSuite ? `${parentSuite} > ${suite.title}` : suite.title;

  if (suite.specs) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        const result = test.results[0];
        entries.push({
          file: suite.file || '',
          suite: suiteName,
          test: spec.title,
          status: (result?.status || test.status) as ReportEntry['status'],
          duration_ms: result?.duration || 0,
          error: result?.errors?.length
            ? result.errors.map((e) => e.message).join('\n')
            : null,
        });
      }
    }
  }

  if (suite.suites) {
    for (const child of suite.suites) {
      entries.push(...extractTests({ ...child, file: child.file || suite.file }, suiteName));
    }
  }

  return entries;
}

function main() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    console.error('Run tests first: npx playwright test');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  const allTests: ReportEntry[] = [];

  for (const suite of raw.suites || []) {
    allTests.push(...extractTests(suite));
  }

  const passed = allTests.filter((t) => t.status === 'passed').length;
  const failed = allTests.filter((t) => t.status === 'failed').length;
  const skipped = allTests.filter((t) => t.status === 'skipped').length;
  const timedOut = allTests.filter((t) => t.status === 'timedOut').length;
  const errors = allTests.filter((t) => t.error !== null);

  const report = {
    summary: {
      total: allTests.length,
      passed,
      failed,
      skipped,
      timedOut,
      timestamp: new Date().toISOString(),
    },
    errors: errors.map((e) => ({
      file: e.file,
      suite: e.suite,
      test: e.test,
      status: e.status,
      error: e.error,
    })),
    all_tests: allTests,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report generated: ${OUTPUT_FILE}`);
  console.log(`   Total: ${allTests.length} | ✅ ${passed} | ❌ ${failed} | ⏭ ${skipped} | ⏱ ${timedOut}`);

  if (errors.length > 0) {
    console.log(`\n🔴 ERRORS (${errors.length}):`);
    for (const e of errors) {
      console.log(`   - [${e.file}] ${e.test}: ${e.error?.substring(0, 120)}...`);
    }
  }
}

main();
