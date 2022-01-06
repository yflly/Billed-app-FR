import { screen, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import firebase from "../__mocks__/firebase";
import Router from "../app/Router";
import Bills from "../containers/Bills.js";
import "@testing-library/jest-dom/extend-expect";
import Firestore from "../app/Firestore.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      //Mock - paramètre pour le bdd du firebase & data fetch
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue() });
      const html = BillsUI({ data: [bills] });
      document.body.innerHTML = html;
      //ROUTES
      const pathname = ROUTES_PATH["Bills"];
      //On construit le  div dom
      Object.defineProperty(window, "location", { value: { hash: pathname } });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = `<div id='root'>${html}</div>`;
      // Init Router
      Router();

      expect(screen.getByTestId("icon-window").classList).toContain(
        "active-icon"
      );
    });

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("When I am on Bills page but it is loading", () => {
      test("Then, Loading page should be rendered", () => {
        const html = BillsUI({ loading: true });
        document.body.innerHTML = html;
        expect(screen.getAllByText("Loading...")).toBeTruthy();
      });
    });

    describe("When I am on Bills page but back-end send an error message", () => {
      test("Then, Error page should be rendered", () => {
        const html = BillsUI({ error: "some error message" });
        document.body.innerHTML = html;
        expect(screen.getAllByText("Erreur")).toBeTruthy();
      });
    });

    describe("When I click on the New Bill button", () => {
      test("Then it should display the New Bill Page", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );

        const billsList = new Bills({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage,
        });

        const html = BillsUI({ data: [] });
        document.body.innerHTML = html;

        const handleClickNewBill = jest.fn(billsList.handleClickNewBill);
        const buttonNewBill = screen.getByTestId("btn-new-bill");
        expect(buttonNewBill).toBeTruthy();
        buttonNewBill.addEventListener("click", handleClickNewBill);
        fireEvent.click(buttonNewBill);
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
      });
    });

    describe("Given I am connected as Employee and I clicked on a icon eye", () => {
      describe("When I click on the icon eye", () => {
        test("A modal should open", () => {
          Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
          });
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
            })
          );
          const html = BillsUI({ data: bills });
          document.body.innerHTML = html;
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          };
          const firestore = null;
          const allBills = new Bills({
            document,
            onNavigate,
            firestore,
            localStorage: window.localStorage,
          });
          $.fn.modal = jest.fn();

          //Obtenir le boutton eye
          const eye = screen.getAllByTestId("icon-eye")[0];
          const handleClickIconEye = jest.fn(() =>
            allBills.handleClickIconEye(eye)
          );
          //Ajouter Event et Fire
          eye.addEventListener("click", handleClickIconEye);
          fireEvent.click(eye);
          expect(handleClickIconEye).toHaveBeenCalled();
          const modale = document.getElementById("modaleFile");
          expect(modale).toBeTruthy();
        });
      });
    });
  });
});

//test d'intégration GET
describe("Given I am a user connected as employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const userbills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(userbills.data.length).toBe(4);
    });
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});
