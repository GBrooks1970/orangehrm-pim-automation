import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { verifyReportPublicationContract } from '../../scripts/ci-report-contract';

const workflow = readFileSync('.github/workflows/ci.yml', 'utf8');

test('real CI workflow preserves failed-test evidence while withholding empty reports', () => {
    verifyReportPublicationContract(workflow);
});

test('rendering after an empty-data guard failure is rejected', () => {
    const broken = workflow.replace("always() && steps.report-data.outcome == 'success'", 'always()');
    assert.notEqual(broken, workflow);
    assert.throws(() => verifyReportPublicationContract(broken), /Rendering must require/);
});

test('uploading after failed rendering is rejected', () => {
    const broken = workflow.replace("always() && steps.render.outcome == 'success'", 'always()');
    assert.notEqual(broken, workflow);
    assert.throws(() => verifyReportPublicationContract(broken));
});

test('a fabricated successful-upload output is rejected', () => {
    const broken = workflow.replace("steps.upload-report.outcome == 'success'", 'true');
    assert.notEqual(broken, workflow);
    assert.throws(() => verifyReportPublicationContract(broken), /output must reflect a successful upload/);
});

test('deploying main without an uploaded report is rejected', () => {
    const broken = workflow.replace(" && needs.e2e.outputs.report-uploaded == 'true'", '');
    assert.notEqual(broken, workflow);
    assert.throws(() => verifyReportPublicationContract(broken), /Pages deployment must require/);
});
