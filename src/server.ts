import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { ValidateEnv } from '@utils/validateEnv';
import { MedicalDevicesRoutes } from './routes/medicalDevice.route';
import { MedicalHistoryRoutes } from './routes/medicalHistory.route';
import { MedicalDataRoutes } from './routes/medicalData.route';
import { VaccinationRoutes } from './routes/vaccination.route';
import { DocumentsRoutes } from './routes/documents.route';
import { ConfigRoutes } from './routes/config.route';

ValidateEnv();

const app = new App([
  new UserRoute(),
  new AuthRoute(),
  new MedicalHistoryRoutes(),
  new MedicalDevicesRoutes(),
  new MedicalDataRoutes(),
  new VaccinationRoutes(),
  new DocumentsRoutes(),
  new ConfigRoutes(),
]);

app.listen();
