import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES } from "../constants/routes.js";
import firebase from "../__mocks__/firebase";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I submit a invalid proof file", () => {
    test("then it should not submit the form and stay on NewBill page", () => {
      // Local storage - Employée
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      //Initialise onNavigate
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Construit l'interface utilisateur
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Initialise newBIll
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      //mock handleSubmit
      const handleSubmit = jest.fn(newBill.handleSubmit);

      // Le fichier est invalide
      newBill.fileName = "invalid";

      // EventListener sur l'envoi du formulaire
      const newBillform = screen.getByTestId("form-new-bill");
      newBillform.addEventListener("submit", handleSubmit);
      fireEvent.submit(newBillform);

      //La fonction handleSubmit doit être appelé
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
  describe("When I submit the form with a proof file", () => {
    test("It should create a new bill with a proof file", () => {
      // Local storage - Employée
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      //Initialise onNavigate
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Construit l'interface utilisateur
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Initialise newBIll
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      //mock handleSubmit
      const handleSubmit = jest.fn(newBill.handleSubmit);

      // EventListener sur l'envoi du formulaire
      const newBillform = screen.getByTestId("form-new-bill");
      newBillform.addEventListener("submit", handleSubmit);
      fireEvent.submit(newBillform);

      //La fonction handleSubmit doit être appelé
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
  describe("When I upload a proof file", () => {
    test("Then it should have the same name in the input", () => {
      // Local storage - Employée
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      //Initialise onNavigate
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Construit l'interface utilisateur
      const html = NewBillUI();
      document.body.innerHTML = html;

      // Initialise newBIll
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      //mock handleChangeFile
      const handleChangeFile = jest.fn(newBill.handleChangeFile);

      // EventListener change sur inputFile
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["test.png"], "test.png", { type: "image/png" })],
        },
      });
      //La fonction handleChangeFile doit être appelé
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("test.png");
    });
  });
});

//test d'intégration POST
describe("Given I am a user connected as an Employee", () => {
  describe("When I create a new bill", () => {
    test("it should add bill firebase mock ", async () => {
      const postSpy = jest.spyOn(firebase, "post");

      // J'initialise ma newBill avec les données
      const newBill = {
        id: "ckDH5SzMAecZALYrHjtL",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "Madrid",
        name: "Montage video",
        fileName: "preview-facture-free-202105-pdf-1.jpg",
        date: "2021-05-20",
        amount: 645,
        commentAdmin: "ok",
        email: "yly@mail.com",
        pct: 20,
      };
      const bills = await firebase.post(newBill);

      //la const postSpy doit avoir été appelé une fois
      expect(postSpy).toHaveBeenCalledTimes(1);

      // le nombre de bills dois être à 5
      expect(bills.data.length).toBe(5);
    });
    test("it should add bill from an API but fails with 404 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("It should add bill from an API and fails with 500 message error", async () => {
      firebase.post.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
