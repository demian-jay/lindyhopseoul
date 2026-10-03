import { installDiagnostics, reportError, showRecovery } from './diagnostics';

installDiagnostics();
import('./main.jsx').catch(error => showRecovery(reportError('startup', error)));
